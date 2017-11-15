import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from 'app/game_model/trigger';

export class OnDeath extends Trigger {
    public getName() {
        return 'Death';
    }

    public register(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }
}

export class OnDeathAnyDeath extends Trigger {
    public getName() {
        return 'Death';
    }

    public register(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitDies, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }
}

