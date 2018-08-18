import { Game } from '../../game';
import { Card } from '../../card';

import { Mechanic, TriggeredMechanic } from '../../mechanic';
import { Player } from '../../player';
import { Unit, UnitType } from '../../unit';
import { ParameterType } from '../parameters';
import { ChoiceHeuristic } from '../../ai';


export class DrawCard extends TriggeredMechanic {
    protected static id = 'DrawCard';
    protected static ParameterTypes = [
        { name: 'Number', type: ParameterType.NaturalNumber }
    ];

    constructor(private count: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        game.getPlayer(card.getOwner()).drawCards(this.count);
    }

    public getText(card: Card) {
        if (this.count === 1)
            return 'Draw a card.';
        return `Draw ${this.count} cards.`;
    }

    public evaluateEffect() {
        return this.count * 3;
    }
}

export class Peek extends TriggeredMechanic {
    protected static id = 'Peek';

    public onTrigger(card: Card, game: Game) {
        game.queryCards(
            (queried: Game) => queried.getPlayer(queried.getOtherPlayerNumber(card.getOwner())).getHand(),
            (hand) => {
                game.promptCardChoice(card.getOwner(), hand, 0, 0, null, '', ChoiceHeuristic.DrawHeuristic);
            });
    }

    public getText(card: Card) {
        return `Peek at your opponents hand.`;
    }

    public evaluateEffect() {
        return 0;
    }
}

export class Discard extends TriggeredMechanic {
    protected static id = 'Discard';
    protected static ParameterTypes = [
        { name: 'Number', type: ParameterType.NaturalNumber }
    ];

    constructor(private count: number = 1) {
        super();
    }
    public onTrigger(card: Card, game: Game) {
        let target = game.getPlayer(game.getOtherPlayerNumber(card.getOwner()));
        target.discard(game, this.count);
    }

    public getText(card: Card) {
        return `Your opponent discards ${this.count === 1 ? 'a card' : this.count + ' cards'}.`;
    }

    public evaluateEffect() {
        return this.count * 2.5;
    }
}

export class DiscardOnDamage extends Mechanic {
    protected static id = 'DiscardOnDamage';

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().DealDamage.addEvent(this,  params => {
                let target = params.target;
                if (target.getUnitType() === UnitType.Player)
                    game.getPlayer((target as Player).getPlayerNumber()).discard(game);
                return params;
            }
        );
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return 'Whenever this damages a player, that player discards a card.';
    }

    public evaluate() {
        return 3;
    }
}

export class AugarCard extends TriggeredMechanic {
    protected static id = 'AugarCard';

    public onTrigger(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let synth = owner.getPool().getOfType('Synthesis');

        if (synth < 4) {
            owner.replace(game, 0, 1);
        } else if (synth < 8) {
            owner.drawCard();
        } else {
            owner.searchForCard(game, 1);
        }
    }

    public getText(card: Card) {
        return `If you have less than 4 synthesis, replace a card. If you have less than 8 draw one. Otherwise search for one.`;
    }

    public evaluateEffect() {
        return 2;
    }
}

