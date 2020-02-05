import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, UnitTargetedMechanic, maybeEvaluate, EvalMap } from '../../mechanic';
import { Unit } from '../../card-types/unit';

export class MindControl extends UnitTargetedMechanic {
    protected static id = 'MindControl';

    public onTrigger(card: Card, game: Game) {
        const targets = this.targeter.getUnitTargets(card, game, this);
        for (const target of targets) {
            game.changeUnitOwner(target);
        }
    }

    public getText(card: Card, game: Game) {
        return `Take control of ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateUnitTarget(source: Card, unit: Unit, game: Game, evaluated: EvalMap) {
        return (
            maybeEvaluate(game, EvalContext.NonlethalRemoval, unit, evaluated) *
            2 *
            (unit.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}
