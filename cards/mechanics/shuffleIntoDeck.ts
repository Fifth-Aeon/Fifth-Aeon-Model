import { Mechanic, TargetedMechanic, EvalContext} from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';

export class ShuffleIntoDeck extends TargetedMechanic {
    public run(card: Card, game: Game) {
        let targets = this.targeter.getTargets(card, game);
        for (let target of targets) {
            game.returnPermanentToDeck(target);
        }
    }

    public getText(card: Card) {
        return `Shuffle ${this.targeter.getText()} into their owner's deck.`
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        return target.evaluate(game, EvalContext.NonlethalRemoval) * (target.getOwner() === source.getOwner() ? -1 : 1);
    }
}
