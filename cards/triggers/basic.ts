import { Card, CardType } from '../../card';
import { Game } from '../../game';

import { EvalContext } from '../../mechanic';
import { removeFirstCapital } from '../../strings';
import { Trigger } from '../../trigger';
import { Unit } from '../../unit';


export class Play extends Trigger {
    protected static id = 'Play';

    public getText(mechanicText: string) {
        return `Play: ${mechanicText}`;
    }

    public register(card: Card, game: Game) {
        card.getEvents().play.addEvent(this, async params => {
            if (card.getCardType() === CardType.Unit)
                this.mechanic.setTriggeringUnit(card as Unit);
            await this.mechanic.onTrigger(card, game);
        });
    }

    public unregister(card: Card, game: Game) {
        card.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.Play)
            return 1;
        return 0;
    }
}

export class UnitEntersPlay extends Trigger {
    protected static id = 'UnitEntersPlay';

    public getText(mechanicText: string) {
        return `When a unit is summoned ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().unitEntersPlay.addEvent(this, async params => {
            this.mechanic.setTriggeringUnit(params.enteringUnit);
            await this.mechanic.onTrigger(card, game);
        });
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}

export class FriendlyUnitEntersPlay extends Trigger {
    protected static id = 'FriendlyUnitEntersPlay';

    public getText(mechanicText: string) {
        return `When you summon a unit ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().unitEntersPlay.addEvent(this, async params => {
            const unit: Unit = params.enteringUnit;
            if (unit.getOwner() === card.getOwner()) {
                this.mechanic.setTriggeringUnit(unit);
                await this.mechanic.onTrigger(card, game);
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

