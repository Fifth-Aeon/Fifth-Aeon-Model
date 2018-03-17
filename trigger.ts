import { Game } from './game';
import { Card, CardType } from './Card';
import { Unit } from './unit';
import { GameEvent, EventType } from './gameEvent';
import { Mechanic, TargetedMechanic, TriggeredMechanic, EvalContext } from './mechanic';

export abstract class Trigger {
    protected mechanic: TriggeredMechanic;
    public attach(mechanic: TriggeredMechanic) {
        this.mechanic = mechanic;
    }
    abstract register(card: Card, game: Game): void;
    abstract unregister(card: Card, game: Game): void;
    public isHidden() { return false; }
    abstract getName(): string;
    abstract evaluate(host: Card, game: Game, context: EvalContext): number;
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
    public evaluate(host: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.Play)
            return 1;
        return 0;
    }
}
