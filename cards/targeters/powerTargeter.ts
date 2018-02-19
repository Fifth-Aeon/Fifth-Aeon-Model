import { Targeter, AllUnits } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Game } from '../../game';

export class LifeLessUnit extends Targeter {
    constructor(private life: number) {
        super();
    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getLife() <= this.life);
    }
    public getText() {
        return 'target unit';
    }
}

export class LifeLessUnits extends AllUnits {
    constructor(private life: number) {
        super();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getLife() <= this.life);
        return this.lastTargets;
    }
    public getText() {
        return `all units with ${this.life} or less life`;
    }
}
