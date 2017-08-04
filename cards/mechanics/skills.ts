import { Mechanic } from '../../mechanic';
import { Game, GamePhase } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Flying extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.CheckBlock, params => {
                let blocker = params.get('blocker') as Unit;
                if (!blocker.hasMechanicWithId('flying'))
                    params.set('canBlock', false)
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Flying`;
    }

    public id() {
        return 'flying';
    }
}


