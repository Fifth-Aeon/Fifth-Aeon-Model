import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Player } from '../../player';

export class RenewalMCTargeter extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        return game.getBoard()
            .getPlayerUnits(game.getOtherPlayerNumber(card.getOwner()))
            .filter(unit =>
                unit.getCost().getNumeric() < owner.getPool().getOfType('Renewal')
            )
    }

    public getText() {
        return 'target unit with cost less than your renewal';
    }
}

export class MindControl extends TargetedMechanic {
    public run(card: Card, game: Game) {
        let targets = this.targeter.getTargets(card, game);
        for (let target of targets) {
            game.changeUnitOwner(target);
        }
    }

    public getText(card: Card, game:Game) {
        return `Take control of ${this.targeter.getText()}.`
    }

    public evaluateTarget(source: Card, unit: Unit, game:Game) {
        return unit.evaluate(game) * 2 * (unit.getOwner() == source.getOwner() ? -1 : 1);
    }
}
