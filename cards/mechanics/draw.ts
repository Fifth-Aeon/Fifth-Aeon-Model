import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Player } from '../../player';

export class DrawCard extends Mechanic {
    constructor(private count: number) {
        super();
    }

    public run(card: Card, game: Game) {
        game.getPlayer(card.getOwner()).drawCards(this.count);
    }

    public getText(card: Card) {
        if (this.count == 1)
            return 'Draw a card.';
        return `Draw ${this.count} cards.`;
    }
}

export class Peek extends Mechanic {
    public run(card: Card, game: Game) {
        game.queryCards(
            (game: Game) => game.getPlayer(game.getOtherPlayerNumber(card.getOwner())).getHand(),
            (deck) => {
                game.promptCardChoice(card.getOwner(), deck, 0, (cards: Card[]) => { });
            });
    }

    public getText(card: Card) {
        return `Peek at your opponents hand.`;
    }
}

export class Discard extends Mechanic {
    constructor() {
        super()
    }
    public run(card: Card, game: Game) {
        let target = game.getPlayer(game.getOtherPlayerNumber(card.getOwner()));
        target.discard(game);
    }

    public getText(card: Card) {
        return `Your opponent discards a card.`;
    }
}

export class AugarCard extends Mechanic {
    public run(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let synth = owner.getPool().getOfType('Synthesis');

        if (synth < 4) {
            owner.replace(game, 1);
        } else if (synth < 8) {
            owner.drawCard();
        } else {
            owner.searchForCard(game, 1);
        }
    }

    public getText(card: Card) {
        return `If you have less than 4 synthesis, replace a card. If you have less than 8 draw one. Otherwise search for one.`;
    }
}

