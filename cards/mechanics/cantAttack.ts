import { Card, CardType } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, Mechanic, TargetedMechanic, maybeEvaluate, EvalMap } from '../../mechanic';
import { Unit } from '../../card-types/unit';

export class CannotAttack extends Mechanic {
    protected static id = 'CannotAttack';
    protected static validCardTypes = new Set([CardType.Unit, CardType.Item]);
    public enter(card: Card, game: Game) {
        (card as Unit).setAttackDisabled(true);
    }

    public remove(card: Card, game: Game) {
        (card as Unit).setAttackDisabled(false);
    }

    public getText(card: Card) {
        return `Cannot attack.`;
    }

    evaluate() {
        return -5;
    }
}

export class CannotBlock extends Mechanic {
    protected static id = 'CannotBlock';
    protected static validCardTypes = new Set([CardType.Unit, CardType.Item]);
    public enter(card: Card, game: Game) {
        (card as Unit).setBlockDisabled(true);
    }

    public remove(card: Card, game: Game) {
        (card as Unit).setBlockDisabled(false);
    }

    public getText(card: Card) {
        return `Cannot block.`;
    }

    evaluate() {
        return -3;
    }
}

export class ImprisonTarget extends TargetedMechanic {
    protected static id = 'ImprisonTarget';
    public onTrigger(card: Card, game: Game) {
        this.targeter.getTargets(card, game, this).forEach(target => {
            target.addMechanic(new CannotAttack(), game);
            target.addMechanic(new CannotBlock(), game);
        });
    }

    public getText(card: Card) {
        return `Cause ${this.targeter.getTextOrPronoun()} to become unable to attack or block.`;
    }

    public evaluateTarget(source: Card, unit: Unit, game: Game, evaluated: EvalMap) {
        return (
            maybeEvaluate(game, EvalContext.NonlethalRemoval, unit, evaluated) *
            0.9 *
            (unit.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}

export class ImprisonTemporarily extends TargetedMechanic {
    protected static id = 'ImprisonTemporarily';
    protected static validCardTypes = new Set([CardType.Unit, CardType.Item, CardType.Enchantment]);
    private targets: Unit[] = [] ;

    public onTrigger(card: Card, game: Game) {
        this.targeter.getTargets(card, game, this).forEach(target => {
            target.addMechanic(new CannotAttack(), game);
            target.addMechanic(new CannotBlock(), game);
            this.targets.push(target);
        });
    }

    public remove(card: Card, game: Game) {
        for (const target of this.targets) {
            target.removeMechanic(CannotAttack.getId(), game);
            target.removeMechanic(CannotBlock.getId(), game);
        }
    }

    public getText(card: Card) {
        return `${this.targeter.getTextOrPronoun()} is unable to attack or block until this dies.`;
    }

    public evaluateTarget(source: Card, unit: Unit, game: Game, evaluated: EvalMap) {
        return (
            maybeEvaluate(game, EvalContext.NonlethalRemoval, unit, evaluated) *
            0.9 *
            (unit.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}