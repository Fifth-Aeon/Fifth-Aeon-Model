import { Game } from './game';
import { Player } from './player';
import { Permanent } from './permanent';
import { Card, CardType, GameZone } from './card';
import { Item } from './item';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic, EvalContext } from './mechanic';

import { remove } from 'lodash';

export enum UnitType {
    Player, Human, Cleric, Wolf, Spider, Snake, Automaton, Monster, Mammal, Soldier,
    Vampire, Cultist, Agent, Undead, Structure, Vehicle, Insect, Dragon,
    Elemental
}

export const mechanical = new Set([UnitType.Automaton, UnitType.Structure, UnitType.Vehicle]);
export function isBiological(unit: Unit) { return !mechanical.has(unit.getUnitType()) }
export function isMechanical(unit: Unit) { return mechanical.has(unit.getUnitType()) }

class Damager {
    private events: EventGroup;
    constructor(private amount: number, private source: Unit, private target: Unit) {
        this.events = source.getEvents().getSubgroup(EventType.DealDamage)
    }
    public run() {
        let result = this.target.takeDamage(this.amount, this.source);
        if (result > 0) {
            this.events.trigger(EventType.DealDamage, new Map<string, any>([
                ['source', this.source],
                ['target', this.target],
                ['amount', this.amount]
            ]));
        }
    }
}

export class Unit extends Permanent {
    // Stats
    protected life: number;
    protected maxLife: number;
    protected damage: number;
    protected died: boolean;

    // Actions
    protected exausted: boolean;
    protected ready: boolean;
    protected attacking: boolean;
    protected blockedUnitId: string | null;
    protected attackDisabled: boolean;
    protected blockDisabled: boolean;

    // Misc
    protected items: Item[];
    private unitType: UnitType;
    private immunities: Set<string>;

    constructor(dataId: string, name: string, imageUrl: string, type: UnitType, cost: Resource, targeter: Targeter, damage: number, maxLife: number, mechanics: Array<Mechanic>) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.unitType = type;
        this.events = new EventGroup();
        this.exausted = false;
        this.ready = false;
        this.attackDisabled = false;
        this.blockDisabled = false;
        this.blockedUnitId = null;
        this.unit = true;
        this.damage = damage;
        this.maxLife = maxLife;
        this.life = this.maxLife;
        this.died = false;
        this.immunities = new Set();
        this.items = [];
    }

    public addItem(item: Item) {
        this.items.push(item);
    }

    public removeItem(item: Item) {
        remove(this.items, item);
    }

    public isPlayable(game: Game): boolean {
        return super.isPlayable(game) &&
            game.getBoard().canPlayPermanant(this);
    }

    public transform(unit: Unit, game: Game) {
        this.cost = unit.cost;
        this.name = unit.name;
        this.imageUrl = unit.imageUrl;
        this.maxLife = unit.maxLife;
        this.life = unit.life;
        this.damage = unit.damage;
        this.unitType = unit.unitType;
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
            this.mechanics.push(mechanic);
            mechanic.attach(this);
        });
        this.mechanics.forEach(mechanic => mechanic.run(this, game))
    }

    public removeMechanic(id: string, game: Game) {
        let target = this.mechanics.find(mechanic => mechanic.id() == id);
        if (!target)
            return;
        target.remove(this, game);
        this.mechanics.splice(this.mechanics.indexOf(target), 1);
    }

    public addMechanic(mechanic: Mechanic, game: Game | null = null) {
        if (this.immunities.has(mechanic.id()))
            return;
        if (mechanic.id() != null && this.hasMechanicWithId(mechanic.id())) {
            this.hasMechanicWithId(mechanic.id()).stack();
            return;
        }
        this.mechanics.push(mechanic);
        mechanic.attach(this);
        if (this.location == GameZone.Board && game != null)
            mechanic.run(this, game)
    }

    public addImmunity(id: string) {
        this.immunities.add(id);
    }

    public removeImmunity(id: string) {
        this.immunities.delete(id);
    }

    public isImmune(id: string) {
        return this.immunities.has(id);
    }

    public hasMechanicWithId(id: string) {
        return this.mechanics.find(mechanic => mechanic.id() == id);
    }

    public getUnitType() {
        return this.unitType;
    }

    public getLife() {
        return this.life;
    }

    public getMaxLife() {
        return this.maxLife;
    }

    public getDamage() {
        return this.damage;
    }

    public getStats() {
        return this.maxLife + this.damage;
    }

    public setExausted(exausted: boolean) {
        this.exausted = exausted;
    }

    public setBlocking(blockedId: string) {
        this.blockedUnitId = blockedId;
    }

    public canBlock() {
        return !this.blockDisabled &&
            !this.exausted;
    }

    public canBlockTarget(toBlock: Unit, hypothetical: boolean = false) {
        return toBlock == null ||
            !this.blockDisabled &&
            !this.exausted &&
            (toBlock.isAttacking() || hypothetical) &&
            toBlock.getEvents().trigger(EventType.CheckCanBlock, new Map<string, any>([
                ['attacker', toBlock],
                ['canBlock', true]
            ])).get('canBlock') &&
            toBlock.getEvents().trigger(EventType.CheckBlockable, new Map<string, any>([
                ['blocker', this],
                ['canBlock', true]
            ])).get('canBlock');
    }

    public isReady() {
        return this.ready;
    }

    public isAttacking() {
        return this.attacking;
    }

    public isBlocking() {
        return this.blockedUnitId != null;
    }

    public isExausted() {
        return this.exausted;
    }

    public toggleAttacking() {
        if (!this.attacking && !this.canAttack())
            return;
        this.attacking = !this.attacking;
    }

    public setAttackDisabled(val: boolean) {
        this.attackDisabled = val;
    }

    public setBlockDisabled(val: boolean) {
        this.blockDisabled = val;
    }

    public canAttack() {
        return !this.attackDisabled && this.ready && !this.exausted;
    }

    public getBlockedUnitId() {
        return this.blockedUnitId;
    }

    public buff(damage: number, maxLife: number) {
        this.damage += damage;
        this.maxLife += maxLife;
        this.life += maxLife;
        this.checkDeath();
    }

    public play(game: Game) {
        super.play(game);
        this.exausted = false;
        this.location = GameZone.Board;
        game.playPermanent(this, this.owner);
    }

    public refresh() {
        this.ready = true;
        this.exausted = false;
        this.life = this.maxLife;
        this.setBlocking(null);
    }

    public getCardType() {
        return CardType.Unit;
    }

    public canActivate(): boolean {
        return !this.exausted;
    }

    public toString() {
        return `${this.name} (${this.cost}) - (${this.damage}/${this.life})`;
    }

    public fight(target: Unit) {
        // Trigger an attack event
        let eventParams = new Map<string, any>([
            ['damage', this.damage],
            ['attacker', this],
            ['defender', target]
        ]);
        let damage: number = this.events.trigger(EventType.Attack, eventParams).get('damage');

        // Remove actions and deal damage
        let damage1 = this.dealDamage(target, damage);
        let damage2 = target.dealDamage(this, target.damage);
        damage1.run();
        damage2.run();
        this.afterDamage(target);
        target.afterDamage(this);

        this.setExausted(true);
        target.setExausted(true);
    }

    public takeDamage(amount: number, source: Card): number {
        amount = this.events.trigger(EventType.TakeDamage, new Map<string, any>([
            ['target', this],
            ['source', source],
            ['amount', amount]
        ])).get('amount');
        this.life -= amount;
        if (this.life <= 0)
            this.died = true;
        this.checkDeath();
        return amount;
    }

    public checkDeath() {
        if (this.life <= 0 || this.died) {
            this.die();
        }
    }

    public kill(instant: boolean) {
        if (instant)
            this.die()
        else
            this.died = true;
    }

    private dealDamage(target: Unit, amount: number): Damager {
        return new Damager(Math.max(amount, 0), this, target);
    }

    private afterDamage(target: Unit) {
        if (target.location == GameZone.Crypt) {
            this.events.trigger(EventType.KillUnit, new Map<string, any>([
                ['source', this],
                ['target', target]
            ]));
        }
    }

    public evaluate(game: Game, context: EvalContext) {
        return this.maxLife + this.damage + super.evaluate(game, context);
    }

    public dealAndApplyDamage(target: Unit, amount: number) {
        this.dealDamage(target, amount).run();
    }

    public leaveBoard(game: Game) {
        this.events.trigger(EventType.LeavesPlay, new Map([['leavingUnit', this]]));
        this.refresh();
        this.blockedUnitId = null;
        this.life = this.maxLife;
        this.ready = false;
        this.exausted = false;
        this.died = false;
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    private dying: boolean = false;
    public die() {
        if (this.location != GameZone.Board || this.dying)
            return;
        this.dying = true;
        this.events.trigger(EventType.Death, new Map());
        this.location = GameZone.Crypt;
        this.dying = false;
        this.died = false;
    }

    public detachItems(game: Game) {
        for (let item of this.items) {
            item.detach(game);
            game.addToCrypt(item);
        }
    }

    public annihilate() {
        this.events.trigger(EventType.Annihilate, new Map());
    }
}
