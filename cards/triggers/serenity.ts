import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';

import { Trigger } from '../../trigger';

export class Serenity extends Trigger {
    protected static id = 'Serenity';

    private triggered = false;

    public getText(mechanicText: string) {
        return `Serenity: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().endOfTurn.addEvent(this, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner() &&
                game.getPhase() === GamePhase.Play1) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        });

    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.25;
    }
}
