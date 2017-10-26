import { Game } from './game';
import { Card, CardType, GameZone } from './card';
import { Unit } from './unit';
import { Targeter } from './targeter';

import { sumBy, multiply, reduce } from 'lodash';

export enum EvalContext {
    LethalRemoval, NonlethalRemoval, Play
}

export interface EvalOperator {
    addend: number;
    multiplier: number;
}

export abstract class Mechanic {
    public attach(parent: Card) {
        if (!this.canAttach(parent))
            throw new Error(`Cannot attach  mechanic ${this.id()} to ${parent.getName()} it is not of the right card type.`);
    };
    abstract run(parent: Card, game: Game): void;
    abstract getText(parent: Card, game: Game): string;
    public remove(card: Card, game: Game) { };
    public id(): string {
        return this.constructor.name;
    };
    abstract evaluate(card: Card, game: Game, context: EvalContext): number | EvalOperator;
    public evaluateTarget(source: Card, target: Unit, game: Game) { return 0; }
    public stack() { }
    public clone(): Mechanic { return this; }

    protected validCardTypes = new Set([CardType.Spell, CardType.Enchantment, CardType.Unit, CardType.Item]);
    public canAttach(card: Card) {
        return this.validCardTypes.has(card.getCardType());
    }

    static getMultiplier(vals: Array<number | EvalOperator>) {
        let multipliers = (vals.filter(val => typeof val == 'object') as EvalOperator[])
            .map(op => op.multiplier);
        return reduce(multipliers, multiply, 1);

    }
    static sumValues(vals: Array<number | EvalOperator>) {
        let multiplier = Mechanic.getMultiplier(vals);
        return multiplier * sumBy(vals, val => {
            if (typeof val == 'object')
                return (val as EvalOperator).addend;
            return val as number;
        });
    }
}

export abstract class TargetedMechanic extends Mechanic {
    constructor(protected targeter?: Targeter) {
        super();
    }

    public attach(parent: Card) {
        super.attach(parent);
        this.targeter = this.targeter || parent.getTargeter();
    }

    public evaluate(card: Card, game: Game) {
        if (card.getLocation() == GameZone.Hand)
            return sumBy(this.targeter.getTargets(card, game),
                (target) => this.evaluateTarget(card, target, game));
        return 0;
    }

}