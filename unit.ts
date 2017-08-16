import { Game } from './game';
import { Player } from './player';
import { Card, Location } from './card';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic } from './mechanic';

export enum UnitType {
    Player, Human, Cleric, Wolf, Spider, Automaton, Monster, Mammal, Soldier,
    Vampire, Cultist, Agent, Undead, Structure, Vehicle, Insect, Dragon
}

export class Unit extends Card {

    private unitType: UnitType

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

    // Modifications
    protected events: EventGroup;

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
    }

    public isPlayable(game: Game): boolean {
        return super.isPlayable(game) &&
            game.getBoard().canPlayUnit(this);
    }

    public transform(unit: Unit, game: Game) {
        this.cost = unit.cost;
        this.name = unit.name;
        this.imageUrl = unit.imageUrl;
        this.maxLife = unit.maxLife;
        this.life = unit.life;
        this.damage = unit.damage;
        this.mechanics.forEach(mechanic => mechanic.remove(this, game));
        this.mechanics = unit.mechanics;
    }

    public removeMechanic(id: string, card: Card, game: Game) {
        let target = this.mechanics.find(mechanic => mechanic.id() == id);
        if (!target)
            return;
        target.remove(card, game);
        this.mechanics.splice(this.mechanics.indexOf(target), 1);
    }

    public addMechanic(mechanic: Mechanic, game: Game | null = null) {
        this.mechanics.push(mechanic);
        mechanic.attach(this);
        if (this.location == Location.Board && game != null)
            mechanic.run(this, game)
    }

    public hasMechanicWithId(id: string) {
        return this.mechanics.find(mechanic => mechanic.id() == id) != undefined;
    }

    public getType() {
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

    public setExausted(exausted: boolean) {
        this.exausted = exausted;
    }

    public setBlocking(blockedId: string) {
        this.blockedUnitId = blockedId;
    }


    public canBlock(toBlock: Unit, hypothetical: boolean = false) {
        return toBlock == null ||
            !this.blockDisabled &&
            !this.exausted &&
            (toBlock.isAttacking() || hypothetical) &&
            toBlock.getEvents().trigger(EventType.CheckBlock, new Map<string, any>([
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

    public getEvents() {
        return this.events;
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
        this.location = Location.Board;
        game.playUnit(this, this.owner);
    }

    public refresh() {
        this.ready = true;
        this.exausted = false;
        this.life = this.maxLife;
        this.setBlocking(null);
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
        let a1 = this.damageDealPhase(target, damage);
        let a2 = target.damageDealPhase(this, target.damage);

        this.damageEventPhase(target, a1);
        target.damageEventPhase(this, a2);

        this.checkDeath();
        target.checkDeath();

        this.setExausted(true);
        target.setExausted(true);
    }

    private takeDamageNoDeath(amount: number): number {
        amount = this.events.trigger(EventType.TakeDamage, new Map<string, any>([
            ['target', this],
            ['amount', amount]
        ])).get('amount');
        this.life -= amount;
        if (this.life <= 0)
            this.died = true;
        return amount;
    }

    public takeDamage(amount: number): number {
        amount = this.takeDamageNoDeath(amount);
        this.checkDeath();
        return amount;
    }

    public kill(instant: boolean) {
        if (instant)
            this.die()
        else
            this.died = true;
    }

    public checkDeath() {
        if (this.died || this.life <= 0) {
            this.die();
            this.died = false;
        }
    }

    private damageDealPhase(target: Unit, amount: number) {
        return target.takeDamageNoDeath(amount);
    }

    private damageEventPhase(target: Unit, amount: number) {
        if (amount > 0) {
            this.events.trigger(EventType.DealDamage, new Map<string, any>([
                ['source', this],
                ['target', target],
                ['amount', amount]
            ]));
        }
        if (target.died) {
            this.events.trigger(EventType.KillUnit, new Map<string, any>([
                ['source', this],
                ['target', target]
            ]));
        }
    }

    public evaluate() {
        return this.maxLife + this.damage;
    }

    public dealDamage(target: Unit, amount: number) {
        this.damageEventPhase(target, this.damageDealPhase(target, amount));
        target.checkDeath();
    }

    public leaveBoard(game: Game) {
        this.events.trigger(EventType.LeavesPlay, new Map([['leavingUnit', this]]));
        this.blockedUnitId = null;
        this.life = this.maxLife;
        this.ready = false;
        this.exausted = false;
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    protected die() {
        if (this.location != Location.Board)
            return;
        this.events.trigger(EventType.Death, new Map());
        this.location = Location.Crypt;
    }

    public annihilate() {
        this.events.trigger(EventType.Annihilate, new Map());
    }
}
