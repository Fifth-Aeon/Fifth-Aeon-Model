import { Card } from '../../card';
import { Game } from '../../game';
import { EventType, GameEvent } from '../../gameEvent';
import { EvalContext } from '../../mechanic';
import { removeFirstCapital } from '../../strings';
import { Trigger } from '../../trigger';


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
        return `When a unit is summoned ${removeFirstCapital(mechanicText)}`;
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

