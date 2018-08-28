import { Card } from '../../card';
import { Game } from '../../game';
import { EvalContext, TargetedMechanic } from '../../mechanic';
import { Unit } from '../../unit';

export class Annihilate extends TargetedMechanic {
    protected static id = 'Annihilate';
    public async onTrigger(card: Card, game: Game) {
        this.targeter.getTargets(card, game, this).forEach(target => {
            target.annihilate();
        });
    }

    public getText(card: Card) {
        return `Annihilate ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        return target.evaluate(game, EvalContext.NonlethalRemoval) * 1.25 * (target.getOwner() === source.getOwner() ? -1 : 1);
    }
}

export class KillTarget extends TargetedMechanic {
    protected static id = 'KillTarget';
    public async onTrigger(card: Card, game: Game) {
        this.targeter.getTargets(card, game, this).forEach(target => {
            target.kill(true);
        });
    }

    public getText(card: Card) {
        return `Kill ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        return target.evaluate(game, EvalContext.LethalRemoval) * 1.0 * (target.getOwner() === source.getOwner() ? -1 : 1);
    }
}

