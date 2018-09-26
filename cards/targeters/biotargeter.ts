import { Targeter } from '../../targeter';
import { AllUnits } from './basicTargeter';
import { isBiological, isMechanical, Unit, UnitType } from '../../unit';
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

export class FriendlyBiologicalUnits extends AllUnits {
    protected static id = 'FriendlyBiologicalUnits';
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

const validTypes = new Set([UnitType.Vehicle, UnitType.Structure]);
export class FriendlyVehicleOrStructure extends Targeter {
    protected static id = 'FriendlyVehicleOrStructure';

    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit =>
            validTypes.has(unit.getUnitType()) && unit.getOwner() === card.getOwner());
    }
    public getText() {
        return 'target friendly Vehicle or Structure';
    }
}


