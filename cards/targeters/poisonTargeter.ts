import { Card } from '../../card';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Unit } from '../../unit';
import { Poisoned } from '../mechanics/poison';
import { AllUnits } from './basicTargeter';

export class PoisonableUnit extends Targeter {
    protected static id = 'PoisonableUnit';
    public getValidTargets(card: Card, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(unit => !unit.isImmune('poisoned'));
    }
    public getText() {
        return 'target unit';
    }
}

export class SleepableUnit extends Targeter {
    protected static id = 'SleepableUnit';
    public getValidTargets(card: Card, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(unit => !unit.isImmune('sleeping'));
    }
    public getText() {
        return 'target unit';
    }
}

export class PoisonableUnits extends AllUnits {
    protected static id = 'PoisonableUnits';
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game
            .getBoard()
            .getAllUnits()
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
        const owner = game.getPlayer(card.getOwner());
        return game
            .getBoard()
            .getPlayerUnits(card.getOwner())
            .filter(unit => unit.hasMechanicWithId(Poisoned.getId()));
    }

    public getText() {
        return 'target poisoned unit';
    }

    public isOptional() {
        return true;
    }
}
