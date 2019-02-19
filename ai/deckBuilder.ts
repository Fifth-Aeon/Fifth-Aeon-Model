import { DeckList } from '../deckList';
import { GameFormat } from '../gameFormat';

/**
 * An A.I deckbuilder used to create a deck for limited formats.
 */
export abstract class DeckBuilder {
    /**
     * Forms a deck from a pool of cards
     * @param pool - The cards from which the deck may be formed.
     * @param format - The format which the deck must comply with.
     */
    abstract formDeckFromPool(pool: DeckList, format: GameFormat): DeckList;
}
