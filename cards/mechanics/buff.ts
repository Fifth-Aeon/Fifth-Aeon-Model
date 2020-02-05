import { Card } from '../../card-types/card';
import { Game } from '../../game';
import {
    EvalContext,
    EvalOperator,
    Mechanic,
    UnitTargetedMechanic,
    EvalMap,
    maybeEvaluate
} from '../../mechanic';
import { properCase, properList } from '../../strings';
import { Unit } from '../../card-types/unit';
import { MechanicConstructor } from '../mechanicConstructor';
import { ParameterType } from '../parameters';

export class BuffTarget extends UnitTargetedMechanic {
    protected static id = 'BuffTarget';
    protected static ParameterTypes = [
        { name: 'damage', type: ParameterType.Integer },
        { name: 'life', type: ParameterType.Integer }
    ];

    constructor(private damage: number = 1, private life: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getUnitTargets(card, game, this)) {
            target.buff(this.damage, this.life);
        }
    }

    private symbol(number: number) {
        return number > 0 ? '+' : '';
    }

    public getText(card: Card) {
        const buffText = `${this.symbol(this.damage)}${
            this.damage
        }/${this.symbol(this.life)}${this.life}`;
        return `Give ${this.targeter.getTextOrPronoun()} ${buffText}.`;
    }

    public evaluateUnitTarget(source: Card, target: Unit) {
        return (
            (this.life + this.damage) *
            1.1 *
            (target.getOwner() === source.getOwner() ? 1 : -1)
        );
    }
}

export class GrantAbility extends UnitTargetedMechanic {
    protected static id = 'GrantAbility';
    protected instance: Mechanic;
    constructor(private ability: MechanicConstructor) {
        super();
        this.instance = new ability();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getUnitTargets(card, game, this)) {
            target.addMechanic(new this.ability(), game);
        }
    }

    public getText(card: Card) {
        return `Give ${this.targeter.getTextOrPronoun()} ${properCase(
            this.ability.getId()
        )}.`;
    }

    public evaluateUnitTarget(
        source: Card,
        target: Unit,
        game: Game,
        evaluated: EvalMap
    ) {
        const val =  2; /*this.instance.evaluate(
            target,
            game,
            EvalContext.Play,
            evaluated
        ); */
        const isFriendly = target.getOwner() === source.getOwner() ? 1 : -1;
        if (typeof val !== 'number') {
            return (
                ((val as EvalOperator).addend +
                    (val as EvalOperator).multiplier *
                        maybeEvaluate(
                            game,
                            EvalContext.Play,
                            target,
                            evaluated
                        )) *
                isFriendly
            );
        }
        return val * isFriendly;
    }
}
