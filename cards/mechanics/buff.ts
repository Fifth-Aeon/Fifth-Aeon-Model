import { Card } from '../../card-types/card';
import { Game } from '../../game';
import {
    EvalContext,
    EvalOperator,
    Mechanic,
    TargetedMechanic
} from '../../mechanic';
import { properCase, properList } from '../../strings';
import { Unit } from '../../card-types/unit';
import { MechanicConstructor } from '../MechanicConstructor';
import { ParameterType } from '../parameters';

export class BuffTarget extends TargetedMechanic {
    protected static id = 'BuffTarget';
    protected static ParameterTypes = [
        { name: 'damage', type: ParameterType.Integer },
        { name: 'life', type: ParameterType.Integer }
    ];

    constructor(private damage: number = 1, private life: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
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

    public evaluateTarget(source: Card, target: Unit) {
        return (
            (this.life + this.damage) *
            1.1 *
            (target.getOwner() === source.getOwner() ? 1 : -1)
        );
    }
}

export class BuffTargetAndGrant extends TargetedMechanic {
    protected static id = 'BuffTargetAndGrant';
    constructor(
        private damage: number = 1,
        private life: number = 1,
        private abilities: Mechanic[] = []
    ) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.buff(this.damage, this.life);
            for (const ability of this.abilities) {
                target.addMechanic(ability, game);
            }
        }
    }

    private abilityString() {
        return properList(
            this.abilities.map(ability => properCase(ability.getId()))
        );
    }

    private symbol(number: number) {
        return number > 0 ? '+' : '';
    }

    public getText(card: Card) {
        const buffText = `${this.symbol(this.damage)}${
            this.damage
        }/${this.symbol(this.life)}${this.life}`;
        if (this.abilities.length > 0) {
            return `Give ${this.targeter.getTextOrPronoun()} ${buffText} and ${this.abilityString()}.`;
        }
        return `Give ${this.targeter.getTextOrPronoun()} ${buffText}.`;
    }

    public evaluateTarget(source: Card, target: Unit) {
        return (
            (this.life + this.damage) *
            1.1 *
            (target.getOwner() === source.getOwner() ? 1 : -1)
        );
    }
}

export class GrantAbility extends TargetedMechanic {
    protected static id = 'GrantAbility';
    protected instance: Mechanic;
    constructor(private ability: MechanicConstructor) {
        super();
        this.instance = new ability();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.addMechanic(new this.ability(), game);
        }
    }

    public getText(card: Card) {
        return `Give ${this.targeter.getTextOrPronoun()} ${properCase(
            this.ability.getId()
        )}.`;
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        let val: EvalOperator | Number;
        if (target.getOwner() === source.getOwner()) {
            val = this.instance.evaluate(target, game, EvalContext.Play);
        } else {
            val = -this.instance.evaluate(target, game, EvalContext.Play);
        }
        if (typeof val !== 'number') {
            return (
                (val as EvalOperator).addend +
                (val as EvalOperator).multiplier *
                    target.evaluate(game, EvalContext.Play)
            );
        }
        return val;
    }
}
