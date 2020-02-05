import { multiply, reduce, sumBy } from 'lodash';
import { Card } from './card-types/card';
import { ParameterType } from './cards/parameters';
import { Play } from './cards/triggers/basic';
import { CardType } from './cardType';
import { Game } from './game';
import { Targeter } from './targeter';
import { Trigger } from './trigger';
import { Unit } from './card-types/unit';
import { Untargeted } from './cards/targeters/basicTargeter';
import { Permanent } from './card-types/permanent';

export enum EvalContext {
    LethalRemoval,
    NonlethalRemoval,
    Play
}

export type EvalMap = Map<Unit, number | null>;

export function maybeEvaluate (game: Game, context: EvalContext, unit: Unit, evaluated: EvalMap) {
    const currentValue = evaluated.get(unit);
    if (currentValue === undefined) {
        evaluated.set(unit, null);
        const value = unit.evaluate(game, context, evaluated);
        evaluated.set(unit, value);
        return value;
    } else if (currentValue === null) {
        return unit.getStats();
    } else {
        return currentValue;
    }
}


export interface EvalOperator {
    addend: number;
    multiplier: number;
}

export abstract class Mechanic {
    protected static validCardTypes = new Set([
        CardType.Spell,
        CardType.Enchantment,
        CardType.Unit,
        CardType.Item
    ]);
    protected static ParameterTypes: {
        name: string;
        type: ParameterType;
    }[] = [];
    protected static id: string;

    static getMultiplier(vals: Array<number | EvalOperator>) {
        const multipliers = (vals.filter(
            val => typeof val === 'object'
        ) as EvalOperator[]).map(op => op.multiplier);
        return reduce(multipliers, multiply, 1);
    }

    static sumValues(vals: Array<number | EvalOperator>) {
        const multiplier = Mechanic.getMultiplier(vals);
        return (
            multiplier *
            sumBy(vals, val => {
                if (typeof val === 'object') {
                    return (val as EvalOperator).addend;
                }
                return val as number;
            })
        );
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

    abstract getText(parent: Card, game?: Game): string;
    abstract evaluate(
        card: Card,
        game: Game,
        context: EvalContext,
        evaluated: EvalMap
    ): number | EvalOperator;

    public remove(card: Card, game: Game) {}

    public stack() {}
    public clone(): Mechanic {
        return this;
    }
    public enter(parent: Card, game: Game) {}
    public attach(parent: Card) {}

    public getId(): string {
        return (this.constructor as any).id;
    }


}

export abstract class TriggeredMechanic extends Mechanic {
    protected triggerType: Trigger = new Play();
    protected triggeringUnit?: Unit;

    abstract onTrigger(parent: Card, game: Game): any;

    public evaluate(
        card: Card,
        game: Game,
        context: EvalContext,
        evaluated: EvalMap
    ): number | EvalOperator {
        const triggerValue = this.triggerType.evaluate(card, game, context);
        if (triggerValue  === 0) {
            return 0;
        }
        let base = this.evaluateEffect(card, game, context, evaluated);
        if (typeof base !== 'object') {
            base = {
                addend: base,
                multiplier: 1
            } as EvalOperator;
        }
        base.multiplier *= triggerValue;
        return base;
    }

    abstract evaluateEffect(
        card: Card,
        game: Game,
        context: EvalContext,
        evaluated: EvalMap
    ): EvalOperator | number;

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

    public setTriggeringUnit(unit: Unit) {
        this.triggeringUnit = unit;
    }

    public getTriggeringUnit() {
        return this.triggeringUnit;
    }
}

export abstract class TargetedMechanic extends TriggeredMechanic {
    protected targeter: Targeter = new Untargeted();
    private targeterSet = false;

    public attach(parent: Card) {
        super.attach(parent);
        if (!this.targeterSet) {
            this.setTargeter(parent.getTargeter());
         }
    }

    public setTargeter(targeter: Targeter) {
        this.targeter = targeter;
        this.targeterSet = true;
        return this;
    }

    public getTargeter() {
        return this.targeter;
    }

    public evaluateEffect(card: Card, game: Game) {
        return sumBy(this.targeter.getUnitTargets(card, game, this), target =>
            this.evaluateTarget(card, target, game, new Map())
        );
    }

    abstract evaluateTarget(source: Card, target: Permanent, game: Game, evaluated: EvalMap): number;
}


export abstract class UnitTargetedMechanic extends TargetedMechanic {
    public evaluateTarget(source: Card, target: Permanent, game: Game, evaluated: EvalMap) {
        if (target instanceof Unit) {
            return this.evaluateUnitTarget(source, target, game, evaluated);
        }
        return 0;
    }

    abstract evaluateUnitTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap): number;
}
