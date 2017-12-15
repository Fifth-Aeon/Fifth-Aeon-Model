import { Targeter, FriendlyUnits, AllUnits } from '../../targeter';
import { isBiological, isMechanical, Unit } from '../../unit';
import { Card } from '../../card';
import { Game } from '../../game';

export class BiologicalUnit extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(isBiological);
    }
    public getText() {
        return 'target biological unit';
    }
}

export class FrendlyBiologicalUnits extends AllUnits {
    public getText() {
        return 'friendly biological units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(isBiological)
            .filter(unit => unit.getOwner() === card.getOwner());
        return this.lastTargets;
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
