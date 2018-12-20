import { Card } from '../../card';
import { Game } from '../../game';
import { TargetedMechanic } from '../../mechanic';
import { Unit } from '../../unit';
import { ParameterType } from '../parameters';

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

    public enter(card: Card, game: Game) {
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
    public enter(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.removeMechanic('flying', game);
            target.setExhausted(true);
        }
    }

    public getText(card: Card) {
        return `Exhaust ${this.targeter.getTextOrPronoun()}. It loses flying.`;
    }
}
