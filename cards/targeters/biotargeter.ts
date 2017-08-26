import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Game } from '../../game';
import { isBiological, isMechanical } from '../../unit';

export class BiologicalUnit extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(isBiological);
    }
    public getText() {
        return 'target biological unit';
    }
}

export class MechanicalUnit extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(isMechanical);
    }
    public getText() {
        return 'target mechanical unit';
    }
}