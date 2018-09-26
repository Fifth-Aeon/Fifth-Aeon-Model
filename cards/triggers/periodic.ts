import { Card } from '../../card';
import { Game } from '../../game';
import { Trigger } from '../../trigger';


export class Dusk extends Trigger {
    protected static id = 'Dusk';

    public getText(mechanicText: string) {
        return `Dusk: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().endOfTurn.addEvent(this, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().endOfTurn.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 2;
    }
}

export class Dawn extends Trigger {
    protected static id = 'Dawn';

    public getText(mechanicText: string) {
        return `Dawn: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().startOfTurn.addEvent(this, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().startOfTurn.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.5;
    }
}

export class Cycle extends Trigger {
    protected static id = 'Cycle';

    public getText(mechanicText: string) {
        return `Cycle: ${mechanicText}`;

    }

    public register(card: Card, game: Game) {
        game.getEvents().startOfTurn.addEvent(this, (params) => {
            this.mechanic.onTrigger(card, game);
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().startOfTurn.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 3;
    }
}
