import { Mechanic, TargetedMechanic, EvalContext } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Player } from '../../player';

export class RenewalMCTargeter extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let threshold = owner.getPool().getOfType('Renewal') / 2;
        return game.getBoard()
            .getPlayerUnits(game.getOtherPlayerNumber(card.getOwner()))
            .filter(unit =>
                unit.getCost().getNumeric() <= threshold
            )
    }

    public getText() {
        return 'target unit with cost less or equal to half your renewal';
    }
}

export class MindControl extends TargetedMechanic {
    protected id = 'MindControl';
    public enter(card: Card, game: Game) {
        let targets = this.targeter.getTargets(card, game);
        for (let target of targets) {
            game.changeUnitOwner(target);
        }
    }

    public getText(card: Card, game: Game) {
        return `Take control of ${this.targeter.getText()}.`
    }

    public evaluateTarget(source: Card, unit: Unit, game: Game) {
        return unit.evaluate(game, EvalContext.NonlethalRemoval) * 2 * (unit.getOwner() === source.getOwner() ? -1 : 1);
    }
}
