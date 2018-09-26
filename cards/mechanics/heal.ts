import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';

import { properCase, properList } from '../../strings';


export class RefreshTarget extends TargetedMechanic {
    protected static id = 'RefreshTarget';
    public onTrigger(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game, this)) {
            target.refresh();
        }
    }

    public getText(card: Card) {
        return `Refresh ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Unit) {
        return 0.1 * (target.isExhausted() ? 1 : 0) * (target.getOwner() === source.getOwner() ? 1 : -1);
    }
}
