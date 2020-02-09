import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, UnitTargetedMechanic, EvalMap, maybeEvaluate, TargetedMechanic } from '../../mechanic';
import { Unit } from '../../card-types/unit';
import { Permanent } from 'app/game_model/card-types/permanent';

export class Annihilate extends TargetedMechanic {
    protected static id = 'Annihilate';
    public onTrigger(card: Card, game: Game) {
        this.targeter.getTargets(card, game, this).forEach(target => {
            target.annihilate();
        });
    }

    public getText(card: Card) {
        return `Annihilate ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Permanent, game: Game, evaluated: EvalMap) {
        if ( target instanceof Unit) {
            return (
                maybeEvaluate(game, EvalContext.NonlethalRemoval, target, evaluated) *
                1.25 *
                (target.getOwner() === source.getOwner() ? -1 : 1)
            );
        }
        return target.getCost().getNumeric() * 2;
    }
}

export class KillTarget extends TargetedMechanic {
    protected static id = 'KillTarget';
    public onTrigger(card: Card, game: Game) {
        this.targeter.getUnitTargets(card, game, this).forEach(target => {
            target.kill(true);
        });
    }

    public getText(card: Card) {
        return `Kill ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Permanent, game: Game, evaluated: EvalMap) {
        if (target instanceof Unit) {
            return (
                maybeEvaluate(game, EvalContext.LethalRemoval, target, evaluated) *
                1.0 *
                (target.getOwner() === source.getOwner() ? -1 : 1)
            );
        }
        return target.getCost().getNumeric() * 2;
    }
}
