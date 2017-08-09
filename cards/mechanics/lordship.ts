import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Lordship extends Mechanic {
    constructor(private text: string,
        private addEffect: (unit: Unit, game: Game) => void,
        private removeEffect: (target: Unit, game: Game) => void,
        private filter: (source: Unit, target: Unit) => boolean) {
        super();
    }

    public run(card: Card, game: Game) {
        let source = card as Unit;
        let targets = game.getBoard().getAllUnits()
            .filter(target => this.filter(source, target))
            .forEach(unit => this.applyToUnit(unit, game));

        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitEntersPlay, (params) => {
            let enteringUnit = params.get('enteringUnit') as Unit;
            if (this.filter(source, enteringUnit)) {
                this.applyToUnit(enteringUnit, game);
            }
            return params;
        }));
    }

    private applyToUnit(unit: Unit, game: Game) {
        this.addEffect(unit, game);
        unit.getEvents().addEvent(this, new GameEvent(EventType.LeavesPlay, (params) => {
            this.removeFromUnit(unit, game);
            return params;
        }))
    }

    private removeFromUnit(unit: Unit, game: Game) {
        unit.getEvents().removeEvents(this);
        this.removeEffect(unit, game);
    }

    public remove(card: Card, game: Game) {
        let targets = game.getBoard().getAllUnits()
            .filter(unit => this.filter(card as Unit, unit))
            .forEach(unit => this.removeFromUnit(unit, game));
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return this.text;
    }
}

export function friendlyLordship(attack: number, life: number) {
    return new Lordship(
        `Other friendly units have +${attack}/+${life}.`,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) => source != target && source.getOwner() == target.getOwner()
    );
}

export function unitTypeLordship(type: UnitType, attack: number, life: number) {
    return new Lordship(
        `Other friendly ${UnitType[type]} have +${attack}/+${life}.`,
        (unit: Unit) => unit.buff(attack, life),
        (unit: Unit) => unit.buff(-attack, -life),
        (source: Unit, target: Unit) => source.getOwner() == target.getOwner() && source != target && type == target.getType()
    );
}