import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';
import { Player } from '../../player';

export class OwnerAttacked extends Trigger {
    protected static id = 'OwnerAttacked';

    public getName() {
        return 'Owner Attacked';
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.PlayerAttacked, (params) => {
            let player = params.get('target') as number;
            if (player === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.25;
    }
}
