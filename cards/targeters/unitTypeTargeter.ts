import { Targeter } from '../../targeter';
import { AllUnits } from './basicTargeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { Game } from '../../game';

export class UnitsOfType extends AllUnits {
    protected static id = 'UnitsOfType';
    constructor(private type: UnitType) {
        super();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getUnitType() === this.type);
        return this.lastTargets;
    }
    public getText() {
        return 'all ' + UnitType[this.type];
    }
}

export class UnitOfType extends Targeter {
    protected static id = 'UnitOfType';
    constructor(private type: UnitType) {
        super();
    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getUnitType() === this.type);
    }
    public getText() {
        return 'target ' + UnitType[this.type];
    }
}
