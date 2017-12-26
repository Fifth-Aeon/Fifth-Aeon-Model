import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';
import { Enchantment } from '../../enchantment';
import { Player } from '../../player';

export class OwnerAttacked extends Trigger {

    public getName() {
        return 'Owner Attacked';
    }

    public register(card: Card, game: Game) {
        let enchantment = card as Enchantment;
        game.gameEvents.addEvent(this, new GameEvent(EventType.PlayerAttacked, (params) => {
            let player = params.get('target') as number;
            if (player === enchantment.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }
}
