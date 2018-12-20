import { Card } from '../../card';
import { Game } from '../../game';
import { Trigger } from '../../trigger';
import { Unit } from '../../unit';

export class LethalStrike extends Trigger {
    protected static id = 'LethalStrike';

    public getText(mechanicText: string) {
        return `Lethal Strike: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        const unit = card as Unit;
        unit.getEvents().killUnit.addEvent(this, params => {
            this.mechanic.setTriggeringUnit(params.target);
            this.mechanic.onTrigger(card, game);
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.5;
    }
}
