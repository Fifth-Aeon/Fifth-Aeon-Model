import { Game } from './game';
import { Card, CardType } from './Card';
import { Unit } from './unit';
import { GameEvent, EventType } from './gameEvent';
import { Mechanic, TargetedMechanic, TriggeredMechanic } from './mechanic';

export abstract class Trigger {
    protected mechanic: TriggeredMechanic;
    public attach(mechanic: TriggeredMechanic) {
        this.mechanic = mechanic;
    }
    abstract register(card: Card, game: Game): void;
    abstract unregister(card: Card, game: Game): void;
    abstract getName(): string;
}


export class NoTrigger extends Trigger {
    public getName() {
        return '';
    }
    public register(card: Card, game: Game) { }
    public unregister(card: Card, game: Game) { }
}

export class PlayTrigger extends Trigger {
    public getName() {
        return 'Play';
    }
    public register(card: Card, game: Game) {
        card.getEvents().addEvent(this, new GameEvent(EventType.Played, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }
    public unregister(card: Card, game: Game) {
        card.getEvents().removeEvents(this);
    }
}
