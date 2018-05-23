import { isBiological, Unit } from '../../unit';
import { Trigger } from '../../trigger';
import { removeFirstCapital } from '../../strings';
import { Card } from '../../card';
import { Game } from '../../game';
import { GameEvent, EventType } from '../../gameEvent';
import { EvalContext } from '../../mechanic';

export class FriendlyBiologicalUnitEntersPlay extends Trigger {
    protected static id = 'FriendlyUnitEntersPlay';

    public getText(mechanicText: string) {
        return `When you summon a biological unit ${removeFirstCapital(mechanicText)}`;
    }

    public register(card: Card, game: Game) {
        game.getEvents().addEvent(this, new GameEvent(EventType.UnitEntersPlay, (params) => {
            const unit: Unit = params.get('enteringUnit');
            if (unit.getOwner() === card.getOwner() && isBiological(unit)) {
                this.mechanic.setTriggeringUnit(unit);
                this.mechanic.onTrigger(card, game);
            }
            return params;
        }));
    }

    public unregister(card: Card, game: Game) {
        game.getEvents().removeEvents(this);
    }

    public evaluate(host: Card, game: Game, context: EvalContext) {
        return 2;
    }
}
