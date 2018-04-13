import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';

export class LethalStrike extends Trigger {
    protected static id = 'LethalStrike';

    public getText(mechanicText: string) {
        return `Lethal Strike': ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.KillUnit, (params) => {
            this.mechanic.onTrigger(card, game);
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public evaluate(host: Card, game: Game) {
        return 1.5;
    }
}
