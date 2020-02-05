import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, UnitTargetedMechanic, EvalMap, maybeEvaluate } from '../../mechanic';
import { Unit } from '../../card-types/unit';

export class Annihilate extends UnitTargetedMechanic {
    protected static id = 'Annihilate';
    public onTrigger(card: Card, game: Game) {
        this.targeter.getUnitTargets(card, game, this).forEach(target => {
            target.annihilate();
        });
    }

    public getText(card: Card) {
        return `Annihilate ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateUnitTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap) {
        return (
            maybeEvaluate(game, EvalContext.NonlethalRemoval, target, evaluated) *
            1.25 *
            (target.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}

export class KillTarget extends UnitTargetedMechanic {
    protected static id = 'KillTarget';
    public onTrigger(card: Card, game: Game) {
        this.targeter.getUnitTargets(card, game, this).forEach(target => {
            target.kill(true);
        });
    }

    public getText(card: Card) {
        return `Kill ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateUnitTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap) {
        return (
            maybeEvaluate(game, EvalContext.LethalRemoval, target, evaluated) *
            1.0 *
            (target.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}
