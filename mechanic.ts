import { Game } from './game';
import { Card, CardType, GameZone } from './card';
import { Unit } from './unit';
import { Targeter } from './targeter';
import { Trigger, PlayTrigger, NoTrigger } from './trigger';

import { sumBy, multiply, reduce } from 'lodash';

export enum EvalContext {
    LethalRemoval, NonlethalRemoval, Play
}

export interface EvalOperator {
    addend: number;
    multiplier: number;
}

export abstract class Mechanic {
    protected validCardTypes = new Set([CardType.Spell, CardType.Enchantment, CardType.Unit, CardType.Item]);
    protected id: string;

    static getMultiplier(vals: Array<number | EvalOperator>) {
        let multipliers = (vals.filter(val => typeof val === 'object') as EvalOperator[])
            .map(op => op.multiplier);
        return reduce(multipliers, multiply, 1);
    }

    static sumValues(vals: Array<number | EvalOperator>) {
        let multiplier = Mechanic.getMultiplier(vals);
        return multiplier * sumBy(vals, val => {
            if (typeof val === 'object')
                return (val as EvalOperator).addend;
            return val as number;
        });
    }

    abstract getText(parent: Card, game: Game): string;
    abstract evaluate(card: Card, game: Game, context: EvalContext): number | EvalOperator;

    public remove(card: Card, game: Game) { }
    public evaluateTarget(source: Card, target: Unit, game: Game) { return 0; }
    public stack() { }
    public clone(): Mechanic { return this; }
    public enter(parent: Card, game: Game) { }


    public attach(parent: Card) {
        if (!this.canAttach(parent))
            throw new Error(`Cannot attach  mechanic ${this.getId()} to ${parent.getName()} it is not of the right card type.`);
    }


    public getId(): string {
        return this.id;
    }

    public canAttach(card: Card) {
        return this.validCardTypes.has(card.getCardType());
    }
}


export abstract class TriggeredMechanic extends Mechanic {
    protected triggerType: Trigger = new PlayTrigger();
    public onTrigger(parent: Card, game: Game) { }

    public setTrigger(trigger: Trigger) {
        this.triggerType = trigger;
        return this;
    }

    public getTrigger() {
        return this.triggerType;
    }

    public attach(parent: Card) {
        super.attach(parent);
        this.triggerType.attach(this);
    }

    public remove(card: Card, game: Game) {
        this.triggerType.unregister(card, game);
    }

    public setTargeter(targeter: Targeter) {
        return this;
    }
}

export abstract class TargetedMechanic extends TriggeredMechanic {
    constructor(protected targeter?: Targeter) {
        super();
    }

    public attach(parent: Card) {
        super.attach(parent);
        this.targeter = this.targeter || parent.getTargeter();
    }

    public setTargeter(targeter: Targeter) {
        this.targeter = targeter;
        return this;
    }

    public evaluate(card: Card, game: Game) {
        if (card.getLocation() === GameZone.Hand)
            return sumBy(this.targeter.getTargets(card, game),
                (target) => this.evaluateTarget(card, target, game));
        return 0;
    }
}
