import { Card } from '../../card';
import { Game } from '../../game';
import { removeFirstCapital } from '../../strings';
import { Targeter } from '../../targeter';
import { Unit, UnitType } from '../../unit';
import { AllUnits } from './basicTargeter';

export class UnitsOfTypeAsTarget extends AllUnits {
    protected static id = 'UnitsOfTypeAsTarget';

    public needsInput() {
        return true;
    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        const target = this.targets[0];
        this.lastTargets = game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getUnitType() === target.getUnitType());
        return this.lastTargets;
    }
    public getText() {
        return 'target unit and all units of the same type';
    }
}

export class UnitsOfType extends AllUnits {
    protected static id = 'UnitsOfType';
    constructor(private type: UnitType) {
        super();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getUnitType() === this.type);
        return this.lastTargets;
    }
    public getText() {
        return 'all ' + removeFirstCapital(UnitType[this.type]) + ' units';
    }
}

export class FriendlyUnitsOfType extends AllUnits {
    protected static id = 'FriendlyUnitsOfType';
    constructor(private type: UnitType) {
        super();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game
            .getBoard()
            .getAllUnits()
            .filter(
                unit =>
                    unit.getUnitType() === this.type &&
                    unit.getOwner() === card.getOwner()
            );
        return this.lastTargets;
    }
    public getText() {
        return (
            'all friendly ' + removeFirstCapital(UnitType[this.type]) + ' units'
        );
    }
}

export class UnitsNotOfType extends AllUnits {
    protected static id = 'UnitsNotOfType';
    constructor(private type: UnitType) {
        super();
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getUnitType() === this.type);
        return this.lastTargets;
    }
    public getText() {
        return 'all non-' + removeFirstCapital(UnitType[this.type]) + ' units';
    }
}

export class UnitOfType extends Targeter {
    protected static id = 'UnitOfType';
    constructor(private type: UnitType) {
        super();
    }
    public getValidTargets(card: Card, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getUnitType() === this.type);
    }
    public getText() {
        return 'target ' + UnitType[this.type];
    }
}
