import { Card } from './card';
import { DeckList } from './deckList';
import { standardFormat } from './gameFormat';
import { cardList} from './cards/cardList';
import { Rewards } from './collection';

import { sampleSize } from 'lodash';

enum DraftState { Drafting, Playing, Ended }

export class Draft {
    /** The format to draft*/
    private static format = standardFormat;
    /** The number of cards a player gets to pick each round */
    private static CardsPerPick = 4;
    /** Maxiumium number of games a player can win before the run ends */
    private static MaxWins = 12;
    /** Maxiumum number of games a player can lose before the run ends */
    private static MaxLosses = 3;

    /** The current state of the draft.
     * Tells us if the player is seleccting cards, playing games or if its over */
    private state = DraftState.Drafting;
    /** The current pick the user is on */
    private pickNumber = 0;
    private choices: Set<Card>;
    /** The players deck */
    private deck = new DeckList(standardFormat);
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
        return this.state === DraftState.Drafting;
    }

    /**
     * Gets the players next choice of card
     *
     * @returns {Array<Card>} The cards a player may choose form
     * @memberof Draft
     */
    getChoices(): Set<Card> {
        if (!this.choices)
            this.choices = new Set(sampleSize(cardList.getCards(), Draft.CardsPerPick));
        return this.choices;
    }

    /**
     * Adds the players choice to their deck and starts next selection round or the game
     *
     * @param {Card} picked The card the player selected
     * @memberof Draft
     */
    pickCard(picked: Card) {
        if (!this.choices.has(picked))
            return;
        this.deck.addCard(picked);
        this.pickNumber++;
        this.choices = undefined;
        if (this.pickNumber === Draft.format.minDeckSize) {
            this.state = DraftState.Playing;
        }
    }

    /**
     * Determines if the player can play a game
     *
     * @returns {boolean} True if the player can start a game
     * @memberof Draft
     */
    canPlayGame(): boolean {
        return this.state === DraftState.Playing;
    }

    /**
     * Updates the draft record after a game
     *
     * @param {boolean} won
     * @memberof Draft
     */
    updateRecord(won: boolean) {
        if (won) {
            this.wins++;
            if (this.wins === Draft.MaxWins) {
                this.state = DraftState.Ended;
            }
        } else {
            this.losses++;
            if (this.losses === Draft.MaxLosses) {
                this.state = DraftState.Ended;
            }
        }
    }

    /**
     * Gets the amount of rewards a player gets based on their results
     *
     * @returns {Rewards} The players rewards for drafting
     * @memberof Draft
     */
    getRewards(): Rewards {
        let packs = 1;
        let gold = 50;
        if (this.wins > 3 && this.wins <= 7) {
            packs = 2;
            gold *= this.wins;
        } else if (this.wins > 7) {
            packs = 4;
            gold *= this.wins;
        }
        let rewards: Rewards = {
            packs: packs,
            gold: gold
        };
        return rewards;
    }

    public hasEnded() {
        return this.state === DraftState.Ended;
    }

    /**
     * Prematurly ends the draft
     * @memberof Draft
     */
    retire() {
        this.state = DraftState.Ended;
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
