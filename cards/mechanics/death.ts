import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class OnDeath extends Mechanic {
    constructor(private effectText: string, private value:number , private effect: (unit: Unit, game: Game) => void) {
        super();
    }

    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            this.effect(unit, game);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `When this unit dies ${this.effectText}.`;
    }

    public evaluate() {
        return this.value;
    }
}

export class OnDeathAnyDeath extends Mechanic {
    constructor(private effectText: string, private value:number, private effect: (source: Unit, died: Unit, game: Game) => void) {
        super();
    }

    public run(card: Card, game: Game) {
        let unit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitDies, (params) => {
            let died = params.get('deadUnit') as Unit;
            this.effect(unit, died, game);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Whenever a unit dies ${this.effectText}.`;
    }

    public evaluate() {
        return this.value;
    }
}

