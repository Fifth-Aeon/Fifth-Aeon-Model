import { Card } from './card';
import { DeckList } from './deckList';
import { standardFormat } from './gameFormat';
import { cardList, allCards } from './cards/allCards';
import { Rewards } from './collection';

enum DraftState { Drafting, Playing, Ended }

export class Draft {
    /** The number of cards a player gets to pick each round */
    private static CardsPerPick = 4;
    /** The number of rounds a player gets to pick a card */
    private static CardPickRounds = 40;
    /** Maxiumium number of games a player can win before the run ends */
    private static MaxWins = 7;
    /** Maxiumum number of games a player can lose before the run ends */
    private static MaxLosses = 0;

    /** The current state of the draft.
     * Tells us if the player is seleccting cards, playing games or if its over */
    private state = DraftState.Drafting;
    /** The current pick the user is on */
    private pickNumber = 0;
    /** The players deck */
    private deck = new DeckList(standardFormat, true);
    /** The number of games a player has won */
    private wins = 0;
    /** The number of games the player has lost */
    private losses = 0;

    /**
     * Determines if the player may pick another card to pick;
     *
     * @returns {boolean}
     * @memberof Draft
     */
    canPickCard(): boolean {
        return false;
    }

    /**
     * Gets the players next choice of card
     *
     * @returns {Array<Card>} The cards a player may choose form
     * @memberof Draft
     */
    getChoices(): Set<Card> {
        return new Set();
    }

    /**
     * Adds the players choice to their deck and starts next selection round or the game
     *
     * @param {Card} picked The card the player selected
     * @memberof Draft
     */
    pickCard(picked: Card) {

    }

    /**
     * Determines if the player can play a game
     *
     * @returns {boolean} True if the player can start a game
     * @memberof Draft
     */
    canPlayGame(): boolean {
        return false;
    }

    /**
     * Updates the draft record after a game
     *
     * @param {boolean} won
     * @memberof Draft
     */
    updateRecord(won: boolean) {

    }

    /**
     * Gets the amount of rewards a player gets based on their results
     *
     * @returns {Rewards} The players rewards for drafting
     * @memberof Draft
     */
    getRewards(): Rewards {
        return null;
    }

    /**
     * Prematurly ends the draft
     * @memberof Draft
     */
    retire() {

    }


    getDeck() {
        return this.deck;
    }

    getWins() {
        return this.wins;
    }

    getLosses() {
        return this.losses;
    }
}
