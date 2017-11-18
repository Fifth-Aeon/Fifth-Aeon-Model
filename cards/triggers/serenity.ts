import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';

export class Serenity extends Trigger {
    private triggered = false;

    public getName() {
        return 'Serenity';
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner() &&
                game.getPhase() === GamePhase.Play1) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));

    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }
}
