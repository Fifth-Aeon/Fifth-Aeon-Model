import { Card, CardType } from '../../card';
import { Game } from '../../game';
import { EventType, GameEvent } from '../../gameEvent';
import { EvalContext } from '../../mechanic';
import { removeFirstCapital } from '../../strings';
import { Trigger } from '../../trigger';
import { Unit } from '../../unit';
import { Player } from '../../player';

export class OwnerDrawsUnit extends Trigger {
    protected static id = 'OwnerDrawsUnit';
    protected owner: Player;

    public getText(mechanicText: string) {
        return `When you draw a unit ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        this.owner = game.getPlayer(card.getOwner());

        this.owner.getEvents().addEvent(this, new GameEvent(EventType.CardDrawn, (params) => {
            let drawn = params.get('card') as Card;
            if (drawn.getCardType() === CardType.Unit) {
                this.mechanic.setTriggeringUnit(drawn as Unit);
                this.mechanic.onTrigger(card, game);
            }
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
