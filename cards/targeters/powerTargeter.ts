import { Card } from '../../card';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Unit } from '../../unit';
import { AllUnits } from './basicTargeter';

export class LifeLessUnit extends Targeter {
    protected static id = 'LifeLessUnit';
    constructor(private life: number) {
        super();
    }
    public getValidTargets(card: Card, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getLife() <= this.life);
    }
    public getText() {
        return 'target unit';
    }
}

export class LifeLessUnits extends AllUnits {
    protected static id = 'LifeLessUnits';
    constructor(private life: number) {
        super();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getLife() <= this.life);
        return this.lastTargets;
    }
    public getText() {
        return `all units with ${this.life} or less life`;
    }
}
