import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Player } from '../../player';

export class DrawCard extends Mechanic {
    constructor(private targeter: Targeter) {
        super();
    }

    public run(card: Card, game: Game) {
        let targets = this.targeter.getTargets(card, game);
        for (let target of targets) {
            let enemyBoard = game.getBoard().getPlayerUnits(target.getOwner());
            let ourBoard = game.getBoard().getPlayerUnits(card.getOwner());

            target.setOwner(card.getOwner());
            enemyBoard.splice(enemyBoard.indexOf(target), 1);
            ourBoard.push(target);
        }
    }

    public getText(card: Card) {
        return `Take control of ${this.targeter.getText()}.`
    }
}


export class AugarCard extends Mechanic {
    public run(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let synth = owner.getPool().getOfType('Synthesis');

        if (synth < 3) {
            owner.replace(game, 1);
        } else if (synth < 6) {
            owner.drawCard();
        } else {
            let deck = owner.getDeck();
            game.promptCardChoice(card.getOwner(), deck, 1, (cards: Card[]) => {
                cards.forEach(card => {
                    owner.drawGeneratedCard(card);
                    deck.splice(deck.indexOf(card), 1);
                });
            });
        }
    }

    public getText(card: Card) {
        return `If you have less than 3 synthesis, replace a card. If you have less than 6 draw one. Otherwise search for one.`
    }
}

