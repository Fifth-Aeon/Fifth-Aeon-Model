import { Targeter } from 'fifthaeon/targeter';
import { Game } from 'fifthaeon/game';
import { Card } from 'fifthaeon/card';

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
        return 'target unit with cost less or equal to half your renewal';
    }
}
