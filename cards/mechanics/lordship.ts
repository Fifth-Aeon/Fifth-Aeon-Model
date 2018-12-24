import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { Mechanic } from '../../mechanic';
import { Permanent } from '../../card-types/permanent';
import { formatBuff } from '../../strings';
import { Unit, UnitType } from '../../card-types/unit';

export class Lordship extends Mechanic {
    protected static id = 'Lordship';
    protected static validCardTypes = Permanent.cardTypes;

    constructor(
        private text: string,
        private valuePerUnit: number,
        private addEffect: (unit: Unit, game: Game) => void,
        private removeEffect: (target: Unit, game: Game) => void,
        private filter: (source: Unit, target: Unit) => boolean
    ) {
        super();
    }

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

export function friendlyLordship(attack: number, life: number) {
    return new Lordship(
        `Other friendly units have ${formatBuff(attack, life)}.`,
        attack + life,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) =>
            source !== target && source.getOwner() === target.getOwner()
    );
}

export function unitTypeLordshipExclusive(
    type: UnitType,
    attack: number,
    life: number
) {
    return new Lordship(
        `Other friendly ${UnitType[type]} have ${formatBuff(attack, life)}.`,
        attack + life,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) =>
            source.getOwner() === target.getOwner() &&
            source !== target &&
            type === target.getUnitType()
    );
}

export function unitTypeLordshipInclusive(
    type: UnitType,
    attack: number,
    life: number
) {
    return new Lordship(
        `Friendly ${UnitType[type]} have ${formatBuff(attack, life)}.`,
        attack + life,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) =>
            source.getOwner() === target.getOwner() &&
            type === target.getUnitType()
    );
}
export function unitTypeLordshipAll(
    type: UnitType,
    attack: number,
    life: number
) {
    return new Lordship(
        `${UnitType[type]} have ${formatBuff(attack, life)}.`,
        attack + life,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) => type === target.getUnitType()
    );
}

export function notUnitLordship(type: UnitType, attack: number, life: number) {
    return new Lordship(
        `Non-${UnitType[type]} have ${formatBuff(attack, life)}.`,
        attack + life,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) => type !== target.getUnitType()
    );
}
