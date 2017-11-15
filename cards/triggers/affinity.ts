import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from 'app/game_model/trigger';

export class Affinity extends Trigger {
    private triggered = false;

    public getName() {
        return 'Affinity';
    }

    public register(card: Card, game: Game) {
        let mutatingUnit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitEntersPlay, (params) => {
            let enteringUnit = params.get('enteringUnit') as Unit;
            if (enteringUnit !== mutatingUnit &&
                enteringUnit.getOwner() === mutatingUnit.getOwner() &&
                enteringUnit.getUnitType() === mutatingUnit.getUnitType()) {
                this.mechanic.onTrigger(card, game);
                game.gameEvents.removeEvents(this);
                this.triggered = true;
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }
}
