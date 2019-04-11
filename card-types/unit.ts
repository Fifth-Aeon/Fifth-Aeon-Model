import { remove } from 'lodash';
import { Card, CardType, GameZone } from './card';
import { AttackEvent, DealDamageEvent } from '../events/cardEventTypes';
import { EventList } from '../events/eventSystems';
import { Game } from '../game';
import { Item } from './item';
import { EvalContext, Mechanic, EvalMap } from '../mechanic';
import { Permanent } from './permanent';
import { Resource } from '../resource';
import { Targeter } from '../targeter';

export enum UnitType {
    Player,
    Human,
    Cleric,
    Wolf,
    Spider,
    Snake,
    Automaton,
    Monster,
    Mammal,
    Soldier,
    Vampire,
    Cultist,
    Agent,
    Undead,
    Structure,
    Vehicle,
    Insect,
    Dragon,
    Elemental,
    Demon,
    Bird
}

export const mechanical = new Set([
    UnitType.Automaton,
    UnitType.Structure,
    UnitType.Vehicle
]);
export function isBiological(unit: Unit) {
    return !mechanical.has(unit.getUnitType());
}
export function isMechanical(unit: Unit) {
    return mechanical.has(unit.getUnitType());
}

class Damager {
    private events: EventList<DealDamageEvent>;
    constructor(
        private amount: number,
        private source: Unit,
        private target: Unit
    ) {
        this.events = source.getEvents().dealDamage.copy();
    }
    public run() {
        const result = this.target.takeDamage(this.amount, this.source);
        if (result > 0) {
            this.events.trigger({
                source: this.source,
                target: this.target,
                amount: this.amount
            });
        }
    }
}

export class Unit extends Permanent {
    // Stats
    protected life: number;
    protected maxLife: number;
    protected damage: number;
    protected died: boolean;
    private dying = false;

    // Actions
    protected exhausted: boolean;
    protected ready: boolean;
    protected attacking = false;
    protected blockedUnitId: string | null;
    protected attackDisabled: boolean;
    protected blockDisabled: boolean;

    // Misc
    protected items: Item[];
    private unitType: UnitType;
    private immunities: Set<string>;

    constructor(
        dataId: string,
        name: string,
        imageUrl: string,
        type: UnitType,
        cost: Resource,
        targeter: Targeter,
        damage: number,
        maxLife: number,
        mechanics: Array<Mechanic>
    ) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.unitType = type;
        this.exhausted = false;
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
        return super.isPlayable(game) && game.getBoard().canPlayPermanent(this);
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
        this.mechanics.forEach(mechanic => mechanic.enter(this, game));
    }

    public removeMechanic(id: string, game: Game) {
        const target = this.mechanics.find(mechanic => mechanic.getId() === id);
        if (!target) {
            return;
        }
        target.remove(this, game);
        this.mechanics.splice(this.mechanics.indexOf(target), 1);
    }

    public addMechanic(mechanic: Mechanic, game: Game | null = null) {
        if (this.immunities.has(mechanic.getId())) {
            return;
        }
        if (mechanic.getId() !== null) {
            const existingCopy = this.hasMechanicWithId(mechanic.getId());
            if (existingCopy) {
                existingCopy.stack();
                return;
            }
        }
        this.mechanics.push(mechanic);
        mechanic.attach(this);
        if (this.location === GameZone.Board && game !== null) {
            mechanic.enter(this, game);
        }
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
        return this.mechanics.find(mechanic => mechanic.getId() === id);
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

    public setExhausted(exhausted: boolean) {
        this.exhausted = exhausted;
    }

    public setBlocking(blockedId: string | null) {
        this.blockedUnitId = blockedId;
    }

    public canBlock() {
        return !this.blockDisabled && !this.exhausted;
    }

    public canBlockTarget(toBlock: Unit, hypothetical: boolean = false) {
        return (
            toBlock === null ||
            (!this.blockDisabled &&
                !this.exhausted &&
                (toBlock.isAttacking() || hypothetical) &&
                this.getEvents().checkCanBlock.trigger({
                    attacker: toBlock,
                    canBlock: true
                }).canBlock &&
                toBlock
                    .getEvents()
                    .checkBlockable.trigger({ blocker: this, canBlock: true })
                    .canBlock)
        );
    }

    public isReady() {
        return this.ready;
    }

    public isAttacking() {
        return this.attacking;
    }

    public isBlocking() {
        return this.blockedUnitId !== null;
    }

    public isExhausted() {
        return this.exhausted;
    }

    public toggleAttacking() {
        if (!this.attacking && !this.canAttack()) {
            console.warn('Toggle attack fail');
            return;
        }
        this.attacking = !this.attacking;
        console.log('Attack toggled', this.attacking);
        console.trace();
    }

    public setAttackDisabled(val: boolean) {
        this.attackDisabled = val;
    }

    public isAttackDisabled() {
        return this.attackDisabled;
    }

    public setBlockDisabled(val: boolean) {
        this.blockDisabled = val;
    }

    public isBlockDisabled() {
        return this.blockDisabled;
    }

    public canAttack() {
        return !this.attackDisabled && this.ready && !this.exhausted;
    }

    public getBlockedUnitId() {
        return this.blockedUnitId;
    }

    public setStats(damage: number, maxLife: number) {
        this.damage = damage;
        this.maxLife = maxLife;
        this.life = maxLife;
        this.checkDeath();
    }

    public buff(damage: number, maxLife: number) {
        this.damage += damage;
        this.maxLife += maxLife;
        this.life += maxLife;
        this.checkDeath();
    }

    public play(game: Game) {
        super.play(game);
        this.exhausted = false;
        this.location = GameZone.Board;
        this.life = this.maxLife;
        game.playPermanent(this);
    }

    public refresh() {
        this.ready = true;
        this.exhausted = false;
        this.life = this.maxLife;
        this.setBlocking(null);
    }

    public getCardType() {
        return CardType.Unit;
    }

    public canActivate(): boolean {
        return !this.exhausted;
    }

    public toString() {
        return `${this.name} (${this.cost}) - (${this.damage}/${this.life})`;
    }

    public fight(target: Unit, damage: number | null = null) {
        // Trigger an attack event
        const eventParams = {
            damage: this.damage,
            attacker: this,
            defender: target
        } as AttackEvent;

        if (damage === null) {
            damage = this.events.attack.trigger(eventParams).damage;
        }

        // Remove actions and deal damage
        const damage1 = this.dealDamageDelayed(target, damage);
        const damage2 = target.dealDamageDelayed(this, target.damage);
        damage1.run();
        damage2.run();
        this.afterDamage(target);
        target.afterDamage(this);

        this.setExhausted(true);
        target.setExhausted(true);
    }

    public takeDamage(amount: number, source: Card): number {
        amount = this.events.takeDamage.trigger({
            target: this,
            source: source,
            amount: amount
        }).amount;
        this.life -= amount;
        this.checkDeath();
        return amount;
    }

    public checkDeath() {
        if (this.life <= 0 || this.died) {
            this.die();
        }
    }

    public kill(instant: boolean) {
        if (instant) {
            this.die();
        } else {
            this.died = true;
        }
    }

    private dealDamageDelayed(target: Unit, amount: number): Damager {
        return new Damager(Math.max(amount, 0), this, target);
    }

    private afterDamage(target: Unit) {
        if (target.location === GameZone.Crypt) {
            this.events.killUnit.trigger({ source: this, target });
        }
    }

    public evaluate(game: Game, context: EvalContext, evaluated: EvalMap) {
        return this.maxLife + this.damage + super.evaluate(game, context, evaluated);
    }

    public getMultiplier(game: Game, context: EvalContext, evaluated: EvalMap) {
        return Mechanic.getMultiplier(
            this.mechanics.map(mechanic =>
                mechanic.evaluate(this, game, context, evaluated)
            )
        );
    }

    public dealAndApplyDamage(target: Unit, amount: number) {
        this.dealDamageDelayed(target, amount).run();
    }

    public leaveBoard(game: Game) {
        this.events.leavesPlay.trigger(new Map([['leavingUnit', this]]));
        this.blockedUnitId = null;
        this.ready = false;
        this.exhausted = false;
        this.died = false;
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    public die() {
        if (this.location !== GameZone.Board || this.dying) {
            return;
        }
        this.dying = true;
        this.events.death.trigger(new Map());
        this.location = GameZone.Crypt;
        this.dying = false;
        this.died = false;
    }

    public detachItems(game: Game) {
        for (const item of this.items) {
            item.detach(game);
            game.addToCrypt(item);
        }
    }

    public annihilate() {
        this.events.annihilate.trigger(new Map());
    }
}
