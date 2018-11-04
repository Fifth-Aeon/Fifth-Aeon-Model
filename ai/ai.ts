import { Animator } from '../animator';
import { ClientGame } from '../clientGame';
import { DeckList } from '../deckList';
import { GameSyncEvent } from '../game';

/**
 * An Artificial Intelligence that can play the game
 */
export abstract class AI {
    /**
     * Construct an Artificial Intelligence that can play the game
     *
     * @param playerNumber - The number of the player which the A.I will control
     * @param game - A ClientGame instance for the A.I to observe and take actions
     * @param deck - The DeckList of the deck the A.I will use
     * @param animator - An Animator instance so the A.I can avoid taking actions during animations
     */
    constructor(
        protected playerNumber: number,
        protected game: ClientGame,
        protected deck: DeckList,
        protected animator: Animator
    ) { }

    /**
     *
     * @param event - A Game Synchronization Event sent by the server
     */
    abstract handleGameEvent(event: GameSyncEvent): void;

    /**
     * Periodically called by the client to give the A.I a chance to act. The rate is configurable.
     * This is to keep the A.I from taking all its actions simultaneously when playing against a human.
     */
    abstract pulse(): void;
}

export interface AIConstructor {
    new(playerNumber: number, game: ClientGame, deck: DeckList, animator: Animator): AI;
}

