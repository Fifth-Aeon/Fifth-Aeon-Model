import { Card } from '../../card';
import { Game } from '../../game';

import { EvalContext } from '../../mechanic';
import { Trigger } from '../../trigger';
import { Unit } from '../../unit';

export class Affinity extends Trigger {
    protected static id = 'Affinity';

    private triggered = false;

    public getText(mechanicText: string) {
        if (this.triggered)
            return `Affinity: [depleted]${mechanicText}[/depleted]`;
        else
            return `Affinity: ${mechanicText}`;
    }


    public evaluate(host: Card, game: Game, context: EvalContext) {
        if (!this.triggered)
            return 0.75;
        return 0;
    }

    public register(card: Card, game: Game) {
        let mutatingUnit = card as Unit;
        game.getEvents().unitEntersPlay.addEvent(this, async params => {
            let enteringUnit = params.enteringUnit;
            if (enteringUnit !== mutatingUnit &&
                enteringUnit.getOwner() === mutatingUnit.getOwner() &&
                enteringUnit.getUnitType() === mutatingUnit.getUnitType()) {
                this.mechanic.setTriggeringUnit(enteringUnit);
                await this.mechanic.onTrigger(card, game);
                this.triggered = true;
                this.unregister(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }
}
