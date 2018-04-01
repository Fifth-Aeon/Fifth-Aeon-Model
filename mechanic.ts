import { Game } from './game';
import { Card, GameZone } from './card';
import { CardType } from './cardType';
import { Unit } from './unit';
import { Targeter } from './targeter';
import { Trigger } from './trigger';

import { sumBy, multiply, reduce } from 'lodash';
import { PlayTrigger } from 'fifthaeon/cards/triggers/basic';
import { ParameterType } from 'fifthaeon/cards/parameters';

export enum EvalContext {
    LethalRemoval, NonlethalRemoval, Play
}

export interface EvalOperator {
    addend: number;
    multiplier: number;
}

export abstract class Mechanic {
    protected static validCardTypes = new Set([CardType.Spell, CardType.Enchantment, CardType.Unit, CardType.Item]);
    protected static ParameterTypes: {name: string, type: ParameterType}[] = [];
    protected static id: string;

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

    static isValidParent(cardType: CardType) {
        return this.validCardTypes.has(cardType);
    }

    static canAttach(card: Card) {
        return this.validCardTypes.has(card.getCardType());
    }

    static getId() {
        return this.id;
    }

    static getParameterTypes() {
        return this.ParameterTypes;
    }

    static getValidCardTypes() {
        return this.validCardTypes;
    }

    abstract getText(parent: Card, game: Game): string;
    abstract evaluate(card: Card, game: Game, context: EvalContext): number | EvalOperator;

    public remove(card: Card, game: Game) { }
    public evaluateTarget(source: Card, target: Unit, game: Game) { return 0; }
    public stack() { }
    public clone(): Mechanic { return this; }
    public enter(parent: Card, game: Game) { }
    public attach(parent: Card) { }

    public getId(): string {
        return (this.constructor as any).id;
    }
}


export abstract class TriggeredMechanic extends Mechanic {
    protected triggerType: Trigger = new PlayTrigger();
    public onTrigger(parent: Card, game: Game) { }


    public evaluate(card: Card, game: Game, context: EvalContext): number | EvalOperator {
        let base = this.evaluateEffect(card, game, context);
        if (typeof base !== 'object') {
            base = {
                addend: base,
                multiplier: 1
            } as EvalOperator;
        }
        base.multiplier *= this.triggerType.evaluate(card, game, context);
        return base;
    }

    abstract evaluateEffect(card: Card, game: Game, context: EvalContext): EvalOperator | number;

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
    protected targeter: Targeter;

    public attach(parent: Card) {
        super.attach(parent);
        this.targeter = this.targeter || parent.getTargeter();
    }

    public setTargeter(targeter: Targeter) {
        this.targeter = targeter;
        return this;
    }

    public evaluateEffect(card: Card, game: Game) {
        return sumBy(this.targeter.getTargets(card, game),
            (target) => this.evaluateTarget(card, target, game));
    }
}
