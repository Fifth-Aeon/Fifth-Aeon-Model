import { Mechanic, TargetedMechanic, EvalContext } from '../../mechanic';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Player } from '../../player';

export class MindControl extends TargetedMechanic {
    protected static id = 'MindControl';
    public enter(card: Card, game: Game) {
        let targets = this.targeter.getTargets(card, game);
        for (let target of targets) {
            game.changeUnitOwner(target);
        }
    }

    public getText(card: Card, game: Game) {
        return `Take control of ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, unit: Unit, game: Game) {
        return unit.evaluate(game, EvalContext.NonlethalRemoval) * 2 * (unit.getOwner() === source.getOwner() ? -1 : 1);
    }
}
