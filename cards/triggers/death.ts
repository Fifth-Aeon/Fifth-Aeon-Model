import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';
import { EvalContext } from '../../mechanic';

export class DeathTrigger extends Trigger {
    protected static id = 'Death';

    public getText(mechanicText: string) {
        return `Death: ${mechanicText}`;
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

    public evaluate(host: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.LethalRemoval)
            return 0.25;
        return 0.9;
    }
}

export class SoulReap extends Trigger {
    protected static id = 'SoulReap';

    public getText(mechanicText: string) {
        return `Soul Reap: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitDies, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}

