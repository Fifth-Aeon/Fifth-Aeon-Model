import { DeckBuilder } from './deckBuilder';
import { DeckList } from '../deckList';
import { GameFormat } from '../gameFormat';
import { sample } from 'lodash';

/** A simple deckbuilder that selects cards at random */
export class RandomBuilder extends DeckBuilder {

    /** Forms a deck of the minimum allowed length by randomly selecting cards from the pool */
    public formDeckFromPool(pool: DeckList, format: GameFormat): DeckList {
        const deck = new DeckList(format);

        while (deck.size() < format.minDeckSize) {
            const pick = sample(pool.getUniqueCards());
            if (!pick) {
                throw new Error(
                    'Error while building deck, not enough cards in pool'
                );
            }
            pool.removeCard(pick);
            deck.addCard(pick);
        }

        return deck;
    }
}
