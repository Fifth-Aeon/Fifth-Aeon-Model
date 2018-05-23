import { Targeter } from '../../targeter';
import { AllUnits } from './basicTargeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Game } from '../../game';

export class PoisonableUnit extends Targeter {
    protected static id = 'PoisonableUnit';
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => !unit.isImmune('poisoned'));
    }
    public getText() {
        return 'target unit';
    }
}

export class SleepableUnit extends Targeter {
    protected static id = 'SleepableUnit';
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => !unit.isImmune('sleeping'));
    }
    public getText() {
        return 'target unit';
    }
}

export class PoisonableUnits extends AllUnits {
    protected static id = 'PoisonableUnits';
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => !unit.isImmune('poisoned'));
        return this.lastTargets;
    }
    public getText() {
        return 'all units';
    }
}

export class CurePoisonTargeter extends Targeter {
    protected static id = 'CurePoisonTargeter';

    public getValidTargets(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        return game.getBoard()
            .getPlayerUnits(card.getOwner())
            .filter(unit => unit.hasMechanicWithId('Poison'));
    }

    public getText() {
        return 'target posioned unit';
    }

    public isOptional() {
        return true;
    }
}
