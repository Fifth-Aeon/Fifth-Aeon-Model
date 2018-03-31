import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';

export class Dusk extends Trigger {
    protected static id = 'Dusk';

    public getName() {
        return 'Dusk';
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 2;
    }
}

export class Dawn extends Dusk {
    protected static id = 'Dawn';

    public getName() {
        return 'dawn';
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.StartOfTurn, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));
    }

    public evaluate(host: Card, game: Game) {
        return 1.5;
    }
}

export class Cycle extends Dusk {
    protected static id = 'Cycle';

    public getName() {
        return 'cycle';
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }

    public evaluate(host: Card, game: Game) {
        return 3;
    }
}
