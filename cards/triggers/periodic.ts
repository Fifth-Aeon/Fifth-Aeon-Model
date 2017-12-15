import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';

class PeriodicTrgger extends Trigger {
    private triggered = false;
    private desc: string;

    constructor(private period: EventType, private frindly: boolean) {
        super();
        this.desc = `${(frindly ? 'Your ' : '')}Turn’s ${period === EventType.EndOfTurn ? 'End' : 'Start'}`;
    }

    public getName() {
        return this.desc;
    }

    public register(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(this.period, (params) => {
            if (!this.frindly || game.getCurrentPlayer().getPlayerNumber() === card.getOwner()) {
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
    return new PeriodicTrgger(EventType.EndOfTurn, true);
}


export function anyEOT() {
    return new PeriodicTrgger(EventType.EndOfTurn, false);
}

export function friendlySOT() {
    return new PeriodicTrgger(EventType.StartOfTurn, true);
}

export function anySOT() {
    return new PeriodicTrgger(EventType.StartOfTurn, false);
}

