import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';

class PeriodicTrgger extends Trigger {
    private triggered = false;
    private desc: string;

    constructor(private period: EventType, private friendly: boolean, private name: string) {
        super();
    }

    public getName() {
        return this.name;
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(this.period, (params) => {
            if (!this.friendly || game.getCurrentPlayer().getPlayerNumber() === card.getOwner()) {
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }
}

export function friendlyEOT() {
    return new PeriodicTrgger(EventType.EndOfTurn, true, 'Dusk');
}


export function anyEOT() {
    return new PeriodicTrgger(EventType.EndOfTurn, false, 'Cycle');
}

export function friendlySOT() {
    return new PeriodicTrgger(EventType.StartOfTurn, true, 'Dawn');
}

export function anySOT() {
    return new PeriodicTrgger(EventType.StartOfTurn, false, 'Start of Any Turn');
}

