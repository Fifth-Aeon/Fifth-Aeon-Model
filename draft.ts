import { sampleSize } from 'lodash';
import { Card } from './card';
import { cardList } from './cards/cardList';
import { Rewards } from './collection';
import { DeckList, SavedDeck } from './deckList';
import { standardFormat } from './gameFormat';


enum DraftState { Drafting, Playing, Ended }

export interface SavedDraft {
    state: DraftState;
    pickNumber: number;
    deck: SavedDeck;
    wins: number;
    losses: number;
    choices: string[];
}

export class Draft {
    public static cost = 200;
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
    private choices: Set<Card> = new Set();
    /** The players deck */
    private deck = new DeckList(standardFormat);
    /** The number of games a player has won */
    private wins = 0;
    /** The number of games the player has lost */
    private losses = 0;

    /**
     * Creates an instance of Draft. Optionally takes an existing saved draft to load.
     * @param {SavedDraft} [saved] - Saved data from a previous draft to load
     * @memberof Draft
     */
    public constructor(saved?: SavedDraft) {
        if (!saved) return;
        this.deck = new DeckList(Draft.format, saved.deck);
        this.wins = saved.wins;
        this.losses = saved.losses;
        this.state = saved.state;
        this.pickNumber = saved.pickNumber;
        this.choices = new Set(Array.from(saved.choices, (id => cardList.getCard(id))));
    }

    /**
     * Transforms the object into a simple interface that can be serilized as JSON
     *
     * @returns {SavedDraft}
     * @memberof Draft
     */
    public toSavable(): SavedDraft {
        return {
            deck: this.deck.getSavable(),
            wins: this.wins,
            losses: this.losses,
            state: this.state,
            pickNumber: this.pickNumber,
            choices: Array.from(this.choices.values(), card => card.getDataId())
        };
    }

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
        if (!this.choices || this.choices.size === 0)
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
        this.choices = new Set();
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
