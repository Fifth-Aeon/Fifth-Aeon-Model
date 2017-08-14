import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';

export class ReturnFromCrypt extends Mechanic {
    constructor(private filter: (card: Card) => boolean) {
        super();
    }

    public run(card: Card, game: Game) {
        let crypt = game.getCrypt(card.getOwner());
        let validCards = crypt.filter(this.filter);
        let player = game.getPlayer(card.getOwner());
        game.promptCardChoice(card.getOwner(), validCards, 1, (raised: Card[]) => {
            raised.forEach(raisedCard => {
                player.drawGeneratedCard(raisedCard);
                crypt.splice(crypt.indexOf(raisedCard), 1);
            });
        });
    }

    public getText(card: Card) {
        return `Return a unit from your crypt to your hand.`
    }
}