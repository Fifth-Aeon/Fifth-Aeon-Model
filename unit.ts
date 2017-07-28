import { Game } from './game';
import { Player } from './player';
import { Card } from './card';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic } from './mechanic';

export enum UnitType {
    Player, Human, Wolf, Spider, Automaton
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

    // Modifications
    protected events: EventGroup;

    constructor(dataId: string, name: string, imageUrl: string, type: UnitType, cost: Resource, targeter: Targeter, damage: number, maxLife: number, mechanics: Array<Mechanic>) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.unitType = type;
        this.events = new EventGroup();
        this.exausted = false;
        this.ready = false;
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

    public getType() {
        return this.unitType;
    }

    public setExausted(exausted: boolean) {
        this.exausted = exausted;
    }

    public setBlocking(blockedId: string) {
        this.blockedUnitId = blockedId;
    }

    public canBlock(toBlock: Unit) {
        return !this.exausted;
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

    public canAttack() {
        return this.ready && !this.exausted;
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

    public takeDamage(amount: number) {
        this.life -= amount;
        if (this.life <= 0) {
            this.die();
        }
    }

    public dealDamage(target: Unit, amount: number) {
        target.takeDamage(amount);
        if (amount > 0) {
            this.events.trigger(EventType.DealDamage, new Map<string, any>([
                ['source', this],
                ['target', target],
                ['amount', amount]
            ]));
        }
    }

    public die() {
        this.events.trigger(EventType.Death, new Map());
    }
}
