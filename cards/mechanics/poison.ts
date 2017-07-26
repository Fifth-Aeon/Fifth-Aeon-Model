import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Poisoned extends Mechanic {
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == unit.getOwner())
                unit.buff(-1, -1);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return 'Poisoned.';
    }
}

export class Venomous extends Mechanic {
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.DealDamage, (params) => {
            let target = params.get('target') as Unit;
            if (target.getType() != UnitType.Player)
                unit.addMechanic(new Poisoned(), game)
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return 'Venomous.';
    }
}
