import { Animator } from '../animator';
import { ClientGame } from '../clientGame';
import { DeckList } from '../deckList';
import { GameSyncEvent } from '../game';

/**
 * An Artificial Intelligence that can play the game.
 *
 * This class contains logic for timing A.I actions but no implemenetaiton of gameplay logic.
 */
export abstract class AI {
    private timer: any;
    protected isImmediateMode = false;
    protected actionSequence: Array<() => boolean> = [];
    protected animator: Animator;
    protected thinking = false;

    /**
     * Construct an Artificial Intelligence that can play the game
     *
     * @param playerNumber - The number of the player which the A.I will control
     * @param game - A ClientGame instance for the A.I to observe and take actions
     * @param deck - The DeckList of the deck the A.I will use
     */
    constructor(
        protected playerNumber: number,
        protected game: ClientGame,
        protected deck: DeckList,
    ) { }

    /** Triggers the A.I to plan out its next actions */
    protected abstract think(): void;

    /**
     *
     * @param event - A Game Synchronization Event sent by the server
     */
    public handleGameEvent(event: GameSyncEvent): void {
        this.game.syncServerEvent(this.playerNumber, event);
    }


    /** Checks if we can take an action, if we can then takes the next one in the action sequence. */
    protected applyNextAction() {
        if (!this.game.canTakeAction() || !this.game.isActivePlayer(this.playerNumber)) {
            return;
        }
        let next = this.actionSequence.shift() || this.game.pass.bind(this.game);
        this.runAction(next);
    }

    /**
     * Executes an action checking if it returns an error status code.
     * If it does then prints out a message.
     */
    private runAction(action: () => boolean) {
        if (action() === false) {
            console.error(`A.I ${this.playerNumber} attempted to take illegal action`, action);
        }
    }

    /**
    * Tells the A.I to start taking actions, but to spread them out over time. It will also wait
    * until the given animator has completed any animations.
    * This is to keep the A.I from taking all its actions simultaneously when playing against a human.
    */
    public startActingDelayMode(delayTimeMs: number, animator: Animator) {
        this.isImmediateMode = false;
        this.animator = animator;

        if (this.timer !== undefined) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.thinking && !this.animator.isAnimating() && this.game.isSyncronized())
                this.applyNextAction();
        }, delayTimeMs);
    }

    /**
     * Tells the A.I to start acting and to immediatly take any action it likes.
     * This is to make the A.I faster for A.I vs A.I battles
     */
    public startActingImmediateMode() {
        this.isImmediateMode = true;
        this.animator = undefined;
    }

    /**
     * Tells the A.I to stop taking any moves when the game is over
     */
    public stopActing() {
        this.actionSequence.length = 0;
        this.isImmediateMode = false;
        if (this.timer !== undefined) clearInterval(this.timer);
    }

    /**
     * Signals to the A.I that it has gained priority and may take actions
     */
    public onGainPriority() {
        if (!this.game.isSyncronized()) {
            this.game.onSync = () => this.onGainPriority();
            return;
        }
        this.thinking = true;
        this.think();
        this.thinking = false;
    }

    /**
     * Adds an action to be run at some point in the future depending on the A.Is timing mode
     * @param action The action to be added to the sequence
     * @param front If true the action will be added to the beginning of the sequence, otherwise it will go at the end.
     */
    protected addActionToSequence(action: () => boolean, front: boolean = false) {
        const boundAction = action.bind(this);
        if (this.isImmediateMode) {
            this.runAction(boundAction);
        } else {
            if (front)
                this.actionSequence.unshift(boundAction);
            else
                this.actionSequence.push(boundAction);
        }
    }

    /**
     * Adds a list of actions to be run to end of the sequence.
     * @param actions - The actions to add
     */
    protected sequenceActions(actions: Array<() => boolean>) {
        if (this.isImmediateMode) {
            for (let action of actions) {
                this.runAction(action);
            }
        } else {
            this.actionSequence = actions.map(action => action.bind(this));
        }
    }
}

