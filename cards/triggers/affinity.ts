import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Trigger } from '../../trigger';
import { EvalContext } from '../../mechanic';

export class Affinity extends Trigger {
    private triggered = false;

    public getName() {
        return 'Affinity';
    }

    public isHidden() {
        return this.triggered;
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        if (!this.triggered)
            return 0.75;
        return 0;
    }

    public register(card: Card, game: Game) {
        let mutatingUnit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitEntersPlay, (params) => {
            let enteringUnit = params.get('enteringUnit') as Unit;
            if (enteringUnit !== mutatingUnit &&
                enteringUnit.getOwner() === mutatingUnit.getOwner() &&
                enteringUnit.getUnitType() === mutatingUnit.getUnitType()) {

                this.mechanic.onTrigger(card, game);

                this.unregister(card, game);
                this.triggered = true;
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }
}
