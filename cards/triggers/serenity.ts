import { Card } from '../../card-types/card';
import { Game, GamePhase } from '../../game';
import { Trigger } from '../../trigger';

export class Serenity extends Trigger {
    protected static id = 'Serenity';

    public getText(mechanicText: string) {
        return `Serenity: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().endOfTurn.addEvent(this, params => {
            if (!this.mechanic) {
                throw new Error('Attempting to activate an unattached trigger.');
            }
            if (
                game.getCurrentPlayer().getPlayerNumber() === card.getOwner() &&
                game.getPhase() === GamePhase.Play1
            ) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().endOfTurn.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.25;
    }
}
