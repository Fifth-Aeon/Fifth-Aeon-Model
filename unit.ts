import { Game } from './game';
import { Player } from './player';
import { Card, Location } from './card';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic } from './mechanic';

export enum UnitType {
    Player, Human, Cleric, Wolf, Spider, Automaton, Undead, Structure, Vehicle, Insect, Dragon
}

export class Unit extends Card {

    private unitType: UnitType

    // Stats
    protected life: number;
    protected maxLife: number;
    protected damage: number;

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
    }

    public addMechanic(mechanic: Mechanic, game: Game | null = null) {
        this.mechanics.push(mechanic);
        if (game != null)
            mechanic.run(this, game)
    }

    public hasMechanicWithId(id: string) {
        return this.mechanics.find(mechanic => mechanic.id() == id) != undefined;
    }
    public getLocation() {
        return this.location;
    }

    public getType() {
        return this.unitType;
    }

    public getLife() {
        return this.life;
    }

    public setExausted(exausted: boolean) {
        this.exausted = exausted;
    }

    public setBlocking(blockedId: string) {
        this.blockedUnitId = blockedId;
    }

    public canBlock(toBlock: Unit) {
        return !this.blockDisabled &&
            !this.exausted &&
            toBlock.getEvents().trigger(EventType.CheckBlock, new Map<string, any>([
                ['blocker', this],
                ['canBlock', true]
            ])).get('canBlock');
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

    public getDamage() {
        return this.damage;
    }

    public getBlockedUnitId() {
        return this.blockedUnitId;
    }

    public buff(damage: number, maxLife: number) {
        this.damage += damage;
        this.maxLife += maxLife;
        this.life += maxLife;
        if (this.life <= 0) {
            this.die();
        }
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
        this.dealDamage(target, damage);
        target.dealDamage(this, target.damage);

        this.setExausted(true);
        target.setExausted(true);
    }

    public takeDamage(amount: number):boolean {
        this.life -= amount;
        if (this.life <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    public dealDamage(target: Unit, amount: number) {
        let died = target.takeDamage(amount);
        if (amount > 0) {
            this.events.trigger(EventType.DealDamage, new Map<string, any>([
                ['source', this],
                ['target', target],
                ['amount', amount]
            ]));
            if (died) {
                this.events.trigger(EventType.KillUnit, new Map<string, any>([
                ['source', this],
                ['target', target]
            ]));
            }
        }
    }

    public leaveBoard(game: Game) {
        this.blockedUnitId = null;
        this.life = this.maxLife;
        this.ready = false;
        this.exausted = false;
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    public die() {
        if (this.location != Location.Board)
            return;
        this.events.trigger(EventType.Death, new Map());
        this.location = Location.Crypt;
    }
}
