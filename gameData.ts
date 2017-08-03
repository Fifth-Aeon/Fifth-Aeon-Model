import { Mechanic } from './mechanic';
import { Card } from './card';
import { sample } from 'lodash';

import { CardFactory, allCards } from './cards/allCards';


class GameData {
    private cards: Map<string, CardFactory> = allCards;

    public addCardConstructor(id: string, constructor: CardFactory) {
        this.cards.set(id, constructor);
    }

    public getCard(id: string): Card {
        let factory = this.cards.get(id);
        if (!factory)
            throw Error('No card with id: ' + id);
        return factory();
    }

    public getRandomDeck(size: number): Card[] {
        let deck = [];
        let cards = Array.from(this.cards.values());
        for (let i = 0; i < size; i++) {
            let constr = sample(cards);
            if (!constr)
                throw new Error("No cards to construct");
            deck.push(constr());
        }
        return deck;
    }

}

export const data = new GameData();