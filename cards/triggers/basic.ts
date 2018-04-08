import { Trigger } from '../../trigger';
import { Game } from '../../game';
import { Card } from '../../card';
import { GameEvent, EventType } from '../../gameEvent';
import { EvalContext } from '../../mechanic';


export class PlayTrigger extends Trigger {
    protected static id = 'PlayTrigger';

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
