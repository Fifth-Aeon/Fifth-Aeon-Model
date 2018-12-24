import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { removeFirstCapital } from '../../strings';
import { Trigger } from '../../trigger';

export class OwnerAttacked extends Trigger {
    protected static id = 'OwnerAttacked';

    public getText(mechanicText: string) {
        return `When this unit’s owner is attacked ${removeFirstCapital(
            mechanicText
        )}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().playerAttacked.addEvent(this, params => {
            if (!this.mechanic) {
                throw new Error('Attempting to activate an unattached trigger.');
            }
            if (params.target === card.getOwner()) {
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
