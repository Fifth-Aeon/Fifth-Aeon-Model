import { Card } from '../../card';
import { Game } from '../../game';
import { TargetedMechanic } from '../../mechanic';
import { Unit } from '../../unit';

export class RefreshTarget extends TargetedMechanic {
    protected static id = 'RefreshTarget';
    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.refresh();
        }
    }

    public getText(card: Card) {
        return `Refresh ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Unit) {
        return (
            0.1 *
            (target.isExhausted() ? 1 : 0) *
            (target.getOwner() === source.getOwner() ? 1 : -1)
        );
    }
}
