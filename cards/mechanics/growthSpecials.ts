import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { TargetedMechanic, maybeEvaluate, EvalContext, EvalMap } from '../../mechanic';
import { Unit } from '../../card-types/unit';
import { ParameterType } from '../parameters';
import { Flying } from './skills';

export class DrawCardsFromUnit extends TargetedMechanic {
    protected static id = 'DrawCardsFromUnit';
    protected static ParameterTypes = [
        { name: 'Factor', type: ParameterType.NaturalNumber }
    ];
    constructor(private factor: number = 3) {
        super();
    }

    private getCards(target: Unit) {
        return Math.floor(target.getStats() / this.factor);
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            game.getPlayer(card.getOwner()).drawCards(this.getCards(target));
        }
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        return this.getCards(target) * 3;
    }

    public getText(card: Card) {
        return `Choose a friendly unit. Draw cards equal to its stats divided by ${
            this.factor
        }.`;
    }
}

export class WebTarget extends TargetedMechanic {
    protected static id = 'WebTarget';

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.removeMechanic(Flying.getId(), game);
            target.setExhausted(true);
        }
    }

    public evaluateTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap) {
        const isEnemy = target.getOwner() === source.getOwner() ? -1 : 1;
        const removesFlying = target.hasMechanicWithId(Flying.getId()) ? 0.05 : .6;
        return isEnemy * removesFlying * maybeEvaluate(game, EvalContext.NonlethalRemoval, target, evaluated);
    }

    public getText(card: Card) {
        return `Exhaust ${this.targeter.getTextOrPronoun()}. It loses flying.`;
    }
}
