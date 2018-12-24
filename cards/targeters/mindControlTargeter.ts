import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { Targeter } from '../../targeter';

export class RenewalMCTargeter extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        const owner = game.getPlayer(card.getOwner());
        const threshold = owner.getPool().getOfType('Renewal') / 2;
        return game
            .getBoard()
            .getPlayerUnits(game.getOtherPlayerNumber(card.getOwner()))
            .filter(unit => unit.getCost().getNumeric() <= threshold);
    }

    public getText() {
        return 'target unit with cost less than or equal to half your renewal';
    }
}
