import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';

import { Trigger } from '../../trigger';
import { Player } from '../../player';
import { removeFirstCapital } from '../../strings';

export class OwnerAttacked extends Trigger {
    protected static id = 'OwnerAttacked';

    public getText(mechanicText: string) {
        return `When this unit’s owner is attacked ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().playerAttacked.addEvent(this, async params => {
            if (params.target === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.25;
    }
}
