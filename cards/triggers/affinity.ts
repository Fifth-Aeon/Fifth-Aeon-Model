import { Card } from '../../card';
import { Game } from '../../game';
import { EventType, GameEvent } from '../../gameEvent';
import { EvalContext } from '../../mechanic';
import { Trigger } from '../../trigger';
import { Unit } from '../../unit';

export class Affinity extends Trigger {
    protected static id = 'Affinity';

    private triggered = false;

    public getText(mechanicText: string) {
        return `Affinity: ${mechanicText}`;
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
                this.mechanic.setTriggeringUnit(enteringUnit);
                this.mechanic.onTrigger(card, game);
                this.triggered = true;
                this.unregister(card, game);
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }
}
