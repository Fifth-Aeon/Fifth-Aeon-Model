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
