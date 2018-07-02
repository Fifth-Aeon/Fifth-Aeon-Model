import { Card } from '../../card';
import { Game } from '../../game';
import { Targeter } from '../../targeter';

export class RenewalMCTargeter extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let threshold = owner.getPool().getOfType('Renewal') / 2;
        return game.getBoard()
            .getPlayerUnits(game.getOtherPlayerNumber(card.getOwner()))
            .filter(unit =>
                unit.getCost().getNumeric() <= threshold
            );
    }

    public getText() {
        return 'target unit with cost less than or equal to half your renewal';
    }
}
