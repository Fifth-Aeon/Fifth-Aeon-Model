import { Targeter, AllUnits } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { Game } from '../../game';

export class UnitsOfType extends AllUnits {
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
