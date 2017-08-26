import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { properCase, properList } from '../../strings';


export class RefreshTarget extends TargetedMechanic {    
    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.refresh()
        }
    }

    public getText(card: Card) {
        return `Refresh ${this.targeter.getText()}.`
    }

    public evaluateTarget(owner: number, target: Unit) {
        return 0.1 * (target.getOwner() == owner ? 1 : -1);
    }
}
