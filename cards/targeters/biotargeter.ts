import { Targeter } from '../../targeter';
import { AllUnits } from './basicTargeter';
import { isBiological, isMechanical, Unit } from '../../unit';
import { Card } from '../../card';
import { Game } from '../../game';

export class BiologicalUnit extends Targeter {
    protected static id = 'BiologicalUnit';
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(isBiological);
    }
    public getText() {
        return 'target biological unit';
    }
}

export class FrendlyBiologicalUnits extends AllUnits {
    protected static id = 'FrendlyBiologicalUnits';
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
    protected static id = 'MechanicalUnit';
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(isMechanical);
    }
    public getText() {
        return 'target mechanical unit';
    }
}
