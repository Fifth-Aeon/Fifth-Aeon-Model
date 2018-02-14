import { Mechanic, TriggeredMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';

export class ReturnFromCrypt extends TriggeredMechanic {
    protected id = 'ReturnFromCrypt';
    constructor(private filter: (card: Card) => boolean) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        let crypt = game.getCrypt(card.getOwner());
        let validCards = crypt.filter(this.filter);
        let player = game.getPlayer(card.getOwner());
        game.promptCardChoice(card.getOwner(), validCards, 1, 1, (raised: Card[]) => {
            raised.forEach(raisedCard => {
                player.drawGeneratedCard(raisedCard);
                crypt.splice(crypt.indexOf(raisedCard), 1);
            });
        }, 'to draw');
    }

    public getText(card: Card) {
        return `Return a unit from your crypt to your hand.`
    }

    public evaluate(card: Card, game: Game) {
        let valid = game.getCrypt(card.getOwner()).filter(this.filter);
        return valid.length > 1 ? 3 : 0;
    }
}
