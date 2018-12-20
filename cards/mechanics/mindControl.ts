import { Card } from '../../card';
import { Game } from '../../game';
import { EvalContext, TargetedMechanic } from '../../mechanic';
import { Unit } from '../../unit';

export class MindControl extends TargetedMechanic {
    protected static id = 'MindControl';

    public onTrigger(card: Card, game: Game) {
        const targets = this.targeter.getTargets(card, game, this);
        for (const target of targets) {
            game.changeUnitOwner(target);
        }
    }

    public getText(card: Card, game: Game) {
        return `Take control of ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, unit: Unit, game: Game) {
        return (
            unit.evaluate(game, EvalContext.NonlethalRemoval) *
            2 *
            (unit.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}
