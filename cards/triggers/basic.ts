import { Trigger } from '../../trigger';
import { Game } from '../../game';
import { Card } from '../../card';
import { GameEvent, EventType } from '../../gameEvent';
import { EvalContext } from '../../mechanic';


export class Play extends Trigger {
    protected static id = 'Play';

    public getText(mechanicText: string) {
        return `Play: ${mechanicText}`;
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

export class UnitEntersPlay extends Trigger {
    protected static id = 'UnitEntersPlay';

    public getText(mechanicText: string) {
        return `When a unit enters play ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().addEvent(this, new GameEvent(EventType.UnitEntersPlay, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}

