import { Card, CardType } from '../../card-types/card';
import { Enchantment } from '../../card-types/enchantment';
import { Unit } from '../../card-types/unit';
import { Game } from '../../game';
import { EnchantmentTargetedMechanic, EvalMap } from '../../mechanic';
import { ParameterType } from '../parameters';

export class RemovePower extends EnchantmentTargetedMechanic {
    protected static id = 'RemovePower';
    protected static ParameterTypes = [
        { name: 'powerRemoved', type: ParameterType.Integer }
    ];

    constructor(protected amount: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getEnchantmentTargets(
            card,
            game,
            this
        )) {
            target.changePower(-this.amount);
        }
    }

    public getText(card: Card, game: Game) {
        return `Remove ${
            this.amount
        } power from ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateEnchantmentTarget(
        source: Card,
        target: Enchantment,
        game: Game,
        evaluated: EvalMap
    ) {
        const isEnemy = target.getOwner() === source.getOwner() ? -1 : 1;
        return (
            isEnemy *
            Math.min(this.amount / target.getPower(), 1) *
            target.getCost().getNumeric() *
            2
        );
    }
}

abstract class DrainPower extends EnchantmentTargetedMechanic {
    protected static id = 'DrainPower';
    protected static ParameterTypes = [
        { name: 'powerRemoved', type: ParameterType.Integer }
    ];

    constructor(protected amount: number = 1) {
        super();
    }

    protected abstract drainEffect(
        card: Card,
        game: Game,
        amount: number
    ): void;

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getEnchantmentTargets(
            card,
            game,
            this
        )) {
            this.drainEffect(card, game, target.changePower(-this.amount));
        }
    }

    public getText(card: Card, game: Game) {
        return `Remove ${
            this.amount
        } power from ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateEnchantmentTarget(
        source: Card,
        target: Enchantment,
        game: Game,
        evaluated: EvalMap
    ) {
        const isEnemy = target.getOwner() === source.getOwner() ? -1 : 1;
        return (
            isEnemy *
            Math.min(this.amount / target.getPower(), 1) *
            target.getCost().getNumeric() *
            2
        );
    }
}

export class DrainPowerIntoStats extends DrainPower {
    protected static id = 'DrainPowerIntoStats';
    protected static ParameterTypes = [
        { name: 'powerRemoved', type: ParameterType.Integer }
    ];
    protected static validCardTypes = new Set([CardType.Unit]);

    protected drainEffect(card: Card, game: Game, amount: number): void {
        (card as Unit).buff(amount, amount);
    }

    public getText(card: Card, game: Game) {
        return `Remove ${
            this.amount
        } power from ${this.targeter.getTextOrPronoun()} and gain that much attack and life.`;
    }
}
