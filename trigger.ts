import { Game } from './game';
import { Card, CardType } from './Card';
import { Unit } from './unit';
import { GameEvent, EventType } from 'app/game_model/gameEvent';
import { Mechanic } from 'app/game_model/mechanic';

export abstract class Trigger {
    protected mechanic: Mechanic;
    public attach(mechanic: Mechanic) {
        this.mechanic = mechanic;
    }
    abstract register(card: Card, game: Game);
    abstract unregister(card: Card, game: Game);
    abstract getName(): string;
}

export class PlayTrigger extends Trigger {
    public getName() {
        return 'Play';
    }
    public register(card: Card, game: Game) {
        card.getEvents().addEvent(this, new GameEvent(EventType.Played, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }))
    }
    public unregister(card: Card, game: Game) {
        card.getEvents().removeEvents(this);
    }
}
