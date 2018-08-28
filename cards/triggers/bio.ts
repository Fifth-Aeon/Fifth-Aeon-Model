import { isBiological, Unit, isMechanical } from '../../unit';
import { Trigger } from '../../trigger';
import { removeFirstCapital } from '../../strings';
import { Card } from '../../card';
import { Game } from '../../game';

import { EvalContext } from '../../mechanic';

export class FriendlyBiologicalUnitEntersPlay extends Trigger {
    protected static id = 'FriendlyBioUnitEntersPlay';

    public getText(mechanicText: string) {
        return `When you summon a biological unit ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().unitEntersPlay.addEvent(this,  async params => {
            if (params.enteringUnit.getOwner() === card.getOwner() && isBiological(params.enteringUnit)) {
                this.mechanic.setTriggeringUnit(params.enteringUnit);
                this.mechanic.onTrigger(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}

export class FriendlyMechanicalUnitEntersPlay extends Trigger {
    protected static id = 'FriendlyMechUnitEntersPlay';

    public getText(mechanicText: string) {
        return `When you summon a mechanical unit ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().unitEntersPlay.addEvent(this,  async params => {
            const unit: Unit = params.enteringUnit;
            if (unit.getOwner() === card.getOwner() && isMechanical(unit)) {
                this.mechanic.setTriggeringUnit(unit);
                this.mechanic.onTrigger(card, game);
            }
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}

