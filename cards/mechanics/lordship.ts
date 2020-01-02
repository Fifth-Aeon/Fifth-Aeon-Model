import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { Mechanic } from '../../mechanic';
import { Permanent } from '../../card-types/permanent';
import { formatBuff } from '../../strings';
import { Unit, UnitType } from '../../card-types/unit';
import { ParameterType } from '../parameters';

abstract class Lordship extends Mechanic {
    protected static id = 'Lordship';
    protected static validCardTypes = Permanent.cardTypes;

    constructor(private valuePerUnit: number) {
        super();
    }

    protected text = '';
    protected abstract addEffect(unit: Unit, game: Game): void;
    protected abstract removeEffect(target: Unit, game: Game): void;
    protected abstract filter(source: Unit, target: Unit): boolean;

    public enter(card: Card, game: Game) {
        const source = card as Unit;
        const targets = this.getTargets(source, game);
        targets.forEach(unit => this.applyToUnit(unit, game));

        game.getEvents().unitEntersPlay.addEvent(this, params => {
            const enteringUnit = params.enteringUnit as Unit;
            if (this.filter(source, enteringUnit)) {
                this.applyToUnit(enteringUnit, game);
            }
            return params;
        });
    }

    private getTargets(source: Unit, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(target => this.filter(source, target));
    }

    private applyToUnit(unit: Unit, game: Game) {
        this.addEffect(unit, game);
        unit.getEvents().leavesPlay.addEvent(this, params => {
            this.removeFromUnit(unit, game);
        });
    }

    private removeFromUnit(unit: Unit, game: Game) {
        unit.getEvents().removeEvents(this);
        this.removeEffect(unit, game);
    }

    public remove(card: Card, game: Game) {
        this.getTargets(card as Unit, game).forEach(unit =>
            this.removeFromUnit(unit, game)
        );
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return this.text;
    }

    public evaluate(card: Card, game: Game) {
        return this.getTargets(card as Unit, game).length * this.valuePerUnit;
    }
}

export class FriendlyLordship extends Lordship {
    protected static id = 'FriendlyLordship';
    protected static ParameterTypes = [
        { name: 'attack', type: ParameterType.Integer },
        { name: 'life', type: ParameterType.Integer }
    ];

    constructor(protected attack: number, protected life: number) {
        super(attack + life);
        this.text = `Other friendly units have ${formatBuff(attack, life)}.`;
    }

    protected addEffect(unit: Unit) {
        unit.buff(this.attack, this.life);
    }

    protected removeEffect(unit: Unit, game: Game) {
        unit.buff(-this.attack, -this.life);
    }

    protected filter(source: Unit, target: Unit) {
        return source !== target && source.getOwner() === target.getOwner();
    }
}

export class UnitTypeLordshipAll extends FriendlyLordship {
    protected static id = 'UnitTypeLordshipAll';
    protected static ParameterTypes = [
        { name: 'unitType', type: ParameterType.UnitType },
        { name: 'attack', type: ParameterType.Integer },
        { name: 'life', type: ParameterType.Integer }
    ];

    constructor(protected unitType: UnitType, attack: number, life: number) {
        super(attack, life);
        this.text = `${UnitType[unitType]} have ${formatBuff(attack, life)}.`;
        this.unitType = unitType;
    }

    protected filter(source: Unit, target: Unit) {
        return (
            this.unitType === target.getUnitType()
        );
    }
}

export class UnitTypeLordshipExclusive extends UnitTypeLordshipAll {
    protected static id = 'UnitTypeLordshipExclusive';

    constructor(type: UnitType, attack: number, life: number) {
        super(type, attack, life);
        this.text = `Other friendly ${UnitType[type]} have ${formatBuff(attack, life)}.`;
    }

    protected filter(source: Unit, target: Unit) {
        return (
            source.getOwner() === target.getOwner() &&
            source !== target &&
            this.unitType === target.getUnitType()
        );
    }
}

export class UnitTypeLordshipInclusive extends UnitTypeLordshipAll {
    protected static id = 'UnitTypeLordshipInclusive';

    constructor(type: UnitType, attack: number, life: number) {
        super(type, attack, life);
        this.text = `Friendly ${UnitType[type]} have ${formatBuff(attack, life)}.`;
    }

    protected filter(source: Unit, target: Unit) {
        return (
            source.getOwner() === target.getOwner() &&
            this.unitType === target.getUnitType()
        );
    }
}

export class NotUnitTypeLordship extends UnitTypeLordshipAll {
    protected static id = 'NotUnitTypeLordship';

    constructor(type: UnitType, attack: number, life: number) {
        super(type, attack, life);
        this.text = `Non-${UnitType[type]} have ${formatBuff(attack, life)}.`;
    }

    protected filter(source: Unit, target: Unit) {
        return (
            this.unitType !== target.getUnitType()
        );
    }
}

