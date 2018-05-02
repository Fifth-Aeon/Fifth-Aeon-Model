import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Card, GameZone } from '../../card';
import { Unit, UnitType } from '../../unit';
import { Resource } from '../../resource';
import { GameEvent, EventType } from '../../gameEvent';

import { remove } from 'lodash';
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
        return Math.floor((target.getStats()) / this.factor);
    }

    public enter(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            game.getPlayer(card.getOwner()).drawCards(this.getCards(target));
        }
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        return this.getCards(target) * 3;
    }

    public getText(card: Card) {
        return `Choose a friendly unit. Draw cards equal to its stats divided by ${this.factor}.`;
    }
}


export class WebTarget extends TargetedMechanic {
    protected static id = 'WebTarget';
    public enter(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.removeMechanic('flying', game);
            target.setExausted(true);
        }
    }

    public getText(card: Card) {
        return `Exaust ${this.targeter.getTextOrPronoun()}. It loses flying.`;
    }
}


