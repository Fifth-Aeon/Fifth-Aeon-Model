import { Card, CardType } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext } from '../../mechanic';
import { Player } from '../../player';
import { removeFirstCapital } from '../../strings';
import { Trigger } from '../../trigger';
import { Unit } from '../../card-types/unit';

export class OwnerDrawsUnit extends Trigger {
    protected static id = 'OwnerDrawsUnit';

    public getText(mechanicText: string) {
        return `When you draw a unit ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        const owner = game.getPlayer(card.getOwner());
        owner.getPlayerEvents().CardDrawn.addEvent(this, params => {
            if (!this.mechanic) {
                throw new Error('Attempting to activate an unattached trigger.');
            }
            const drawn = params.card;
            if (drawn.getCardType() === CardType.Unit) {
                this.mechanic.setTriggeringUnit(drawn as Unit);
                this.mechanic.onTrigger(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}
