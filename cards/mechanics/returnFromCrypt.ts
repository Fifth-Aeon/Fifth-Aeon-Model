import { Mechanic, TriggeredMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { ParameterType } from 'fifthaeon/cards/parameters';
import { CardType } from 'fifthaeon/cardType';

export class ReturnFromCrypt extends TriggeredMechanic {
    protected static id = 'ReturnFromCrypt';
    protected static ParameterTypes = [
        { name: 'Card Type', type: ParameterType.CardType }
    ];

    constructor(private allowed: CardType) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        let crypt = game.getCrypt(card.getOwner());
        let validCards = this.getValidCards(card, game);
        let player = game.getPlayer(card.getOwner());
        game.promptCardChoice(card.getOwner(), validCards, 0, 1, (raised: Card[]) => {
            raised.forEach(raisedCard => {
                player.drawGeneratedCard(raisedCard);
                crypt.splice(crypt.indexOf(raisedCard), 1);
            });
        }, 'to draw');
    }

    public getText(card: Card) {
        return `Return a ${CardType[this.allowed]} from your crypt to your hand.`;
    }

    public evaluateEffect(card: Card, game: Game) {
        return this.getValidCards(card, game).length > 1 ? 3 : 0;
    }

    private getValidCards(card: Card, game: Game) {
        return game.getCrypt(card.getOwner()).filter((cryptCard) => cryptCard.getCardType() === this.allowed);
    }
}
