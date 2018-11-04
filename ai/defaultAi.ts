import { maxBy, meanBy, minBy, remove, sortBy, sumBy, take } from 'lodash';
import { LinkedList } from 'typescript-collections';
import { knapsack, KnapsackItem } from '../algorithms';
import { Animator } from '../animator';
import { Card, CardType } from '../card';
import { TransformDamaged } from '../cards/mechanics/decaySpecials';
import { Flying, Lethal, Shielded } from '../cards/mechanics/skills';
import { ClientGame } from '../clientGame';
import { DeckList } from '../deckList';
import { Enchantment } from '../enchantment';
import { GamePhase, GameSyncEvent, SyncEventType } from '../game';
import { Item } from '../item';
import { EvalContext } from '../mechanic';
import { Player } from '../player';
import { Resource, ResourceTypeNames } from '../resource';
import { Unit } from '../unit';
import { AI } from './ai';

/**
 * Determines which heuristic to be used when the A.I makes a choice.
 * Choices are any time the game asks a user to select 1 or more cards,
 * such as when discarding or searching their deck.
 */
export enum ChoiceHeuristic {
    DrawHeuristic,
    DiscardHeuristic,
    ReplaceHeuristic,
    HighestStatsHeuristic
}

/**
 * Represents an action (playing a card, an item or an enchantment)
 * whose value has already been determined (By a heuristic)
 */
interface EvaluatedAction {
    score: number;
    cost: number;
    card?: Card;
    enchantmentTarget?: Enchantment;
    target?: Unit;
    host?: Unit;
}

/** Represents the outcome of a 1v1 fight based on which of the two units die */
enum BlockOutcome {
    AttackerDies, NeitherDies, BothDie, BlockerDies
}

/**
 * A heuristics based A.I
 *
 * This is the default opponent for singleplayer.
 *
 * It is built on heuristics and does not use any tree search based algorithm.
 * As such, it runs quite fast but is prone to making short sighted moves.
 *
 * Known Flaws
 * - Doesn't currently consider the value of enchantments when empowering them (only their cost)
 * - Doesn't currently take most global effects into play such as the effect of Death's Ascendence
 *   (which makes it pointless to play certain units as they will die instantly)
 * - See documentation of attack and block methods for weaknesses in attack/blocking logic
 *
 */
export class DefaultAI extends AI {
    private eventHandlers: Map<SyncEventType, (params: any) => void> = new Map();
    private enemyNumber: number;
    private aiPlayer: Player;
    private actionSequence: LinkedList<() => void> = new LinkedList<() => void>();

    /**
     * Creates an instance of DefaultAI.
     *
     * @param {number} playerNumber - The number of the player the A.I will control
     * @param {ClientGame} game - The interface by which the A.I will take actions and observe state
     * @param {DeckList} deck - The DeckList of the deck the A.I will play
     * @param {Animator} animator - An animator to avoid acting during animations
     * @memberof DefaultAI
     */
    constructor(playerNumber: number, game: ClientGame, deck: DeckList, animator: Animator) {
        super(playerNumber, game, deck, animator);
        this.aiPlayer = this.game.getPlayer(this.playerNumber);
        this.enemyNumber = this.game.getOtherPlayerNumber(this.playerNumber);
        this.game.setOwningPlayer(this.playerNumber);

        this.game.promptCardChoice = this.makeChoice.bind(this);
        this.eventHandlers.set(SyncEventType.TurnStart, event => this.onTurnStart(event.params));
        this.eventHandlers.set(SyncEventType.PhaseChange, event => this.onPhaseChange(event.params));
        this.eventHandlers.set(SyncEventType.ChoiceMade, event => this.think());
    }

    /** Triggers the A.I to consider what its next action should be */
    private think() {
        if (!this.game.isActivePlayer(this.playerNumber))
            return;
        if (this.game.getPhase() === GamePhase.Block) {
            this.block();
        } else {
            if (this.game.canPlayResource())
                this.playResource();
            this.sequenceActions([this.selectActions, this.attack]);
        }
    }

    /**
     * Invoked by the client when the A.I should take another action
    */
    public pulse() {
        this.continue();
    }

    /**
     * Adds an action to be run the next time the game requests the A.I to do something
     * @param action The action to be added to the sequence
     * @param front If true the action will be added to the beginning of the sequence, otherwise it will go at the end.
     */
    private addActionToSequence(action: () => void, front: boolean = false) {
        this.actionSequence.add(action.bind(this), front ? 0 : this.actionSequence.size());
    }

    /**
     * Adds a list of actions to be run to end of the sequence.
     * @param actions - The actions to add
     */
    private sequenceActions(actions: Array<() => void>) {
        this.actionSequence = new LinkedList<() => void>();
        for (let action of actions) {
            this.addActionToSequence(action);
        }
    }

    /** Gets the next action from the action sequence and removes it */
    private dequeue(): () => void {
        let val = this.actionSequence.first();
        this.actionSequence.remove(val);
        return val;
    }

    /** Checks if we can take an action, if we can then takes the next one in the action sequence. */
    private continue() {
        if (this.animator.isAnimating())
            return;
        if (!this.game.canTakeAction() || !this.game.isActivePlayer(this.playerNumber))
            return;
        let next = this.dequeue() || this.game.pass.bind(this.game);
        let result = next();
        if (result === false) {
            console.log('A.I attempted to take illegal action', next);
        }
    }

    /** A simple heuristic to determine which card is best to draw
       This heuristic assumes it is best to draw cards whose cost
       is close to the amount of resources we have.*/
    private cardDrawHeuristic(card: Card): number {
        return Math.abs(this.aiPlayer.getPool().getNumeric() - card.getCost().getNumeric());
    }

    /** Decides which cards of a set of choices to choose to draw. */
    private evaluateToDraw(choices: Card[], min: number, max: number): Card[] {
        return take(sortBy(choices, card =>
            this.cardDrawHeuristic(card)
        ), max);
    }

    /** Decides which cards of a set of choices to discard
    * The heuristic is the inverse of the to draw heuristic. */
    private evaluateToDiscard(choices: Card[], min: number, max: number): Card[] {
        return take(sortBy(choices, card =>
            -this.cardDrawHeuristic(card)
        ), min);
    }

    /** Decides which cards of a set to replace.
    * We replace a card if we think it is worse than the average card in our deck based on the card draw heuristic. */
    private evaluateToReplace(choices: Card[], min: number, max: number): Card[] {
        let worst = sortBy(choices, card =>
            -this.cardDrawHeuristic(card)
        );
        let mandatory = take(worst, min);
        let optional = worst.slice(min);
        if (optional.length > 0) {
            let average = meanBy(this.deck.getUniqueCards(), this.cardDrawHeuristic.bind(this));
            optional = optional.filter(card => this.cardDrawHeuristic(card) > average);
        }
        return mandatory.concat(optional);
    }

    /** A heuristic that chooses the unit with the highest total stats (all choices must be Units) */
    private highestStatHeuristic(choices: Card[], min: number, max: number): Card[] {
        return take(sortBy(choices as Unit[], unit => -unit.getStats()), max);
    }

    /** Get the appropriate heuristic for making a choice */
    private getHeuristic(heuristicType: ChoiceHeuristic): (choices: Card[], min: number, max: number) => Card[] {
        switch (heuristicType) {
            case ChoiceHeuristic.DrawHeuristic:
                return this.evaluateToDraw.bind(this);
            case ChoiceHeuristic.DiscardHeuristic:
                return this.evaluateToDiscard.bind(this);
            case ChoiceHeuristic.HighestStatsHeuristic:
                return this.highestStatHeuristic.bind(this);
            case ChoiceHeuristic.ReplaceHeuristic:
                return this.evaluateToReplace.bind(this);
        }
    }

    /** Returns the cards that should be chosen for a given choice based on its heuristic */
    private getCardToChoose(options: Array<Card>, min: number = 1, max: number = 1, heuristicType: ChoiceHeuristic) {
        if (options.length < min)
            return options;
        let evaluator = this.getHeuristic(heuristicType);
        return evaluator(options, min, max);
    }

    /** Makes a choice when requested to by the game engine (such as what cards to mulligan) */
    private makeChoice(
        player: number, options: Array<Card>, min: number = 1, max: number = 1,
        callback: (cards: Card[]) => void = null,
        message: string,
        heuristicType: ChoiceHeuristic
    ) {
        if (!callback) {
            return;
        }
        this.game.deferChoice(player, options, min, max, callback);
        if (player !== this.playerNumber) {
            return;
        }
        this.game.makeChoice(this.playerNumber, this.getCardToChoose(options, min, max, heuristicType));
    }

    /** Handles a game event using a registered handler (or ignores it if there is no registered handler) */
    public handleGameEvent(event: GameSyncEvent) {
        this.game.syncServerEvent(this.playerNumber, event);
        if (this.eventHandlers.has(event.type))
            this.eventHandlers.get(event.type)(event);
    }

    /** Invoked when the A.I's turn starts with the following basic plan.
     *
     * 1. Play a resource
     * 2. Take as many useful actions (playing cards or modifying resourced) as possible
     * 3. Make any advantageous attacks.
     */
    private onTurnStart(params: any) {
        if (this.playerNumber !== params.turn)
            return;
        this.think();
    }

    /** Gets the best target for a card with a targeter.
     * The best target is considered to be the one with the highest evaluateTarget value.
     */
    private getBestTarget(card: Card): EvaluatedAction {
        let targets = card.getTargeter().getValidTargets(card, this.game);
        if (targets.length === 0)
            return { score: 0, cost: card.getCost().getNumeric(), card: card };
        let best = maxBy(targets, target => card.evaluateTarget(target, this.game));
        return { target: best, score: card.evaluateTarget(best, this.game), cost: card.getCost().getNumeric(), card: card };
    }

    /**
     * Evaluates a card based on its value and the value of its target.
     *
     * @param {Card} card - The card to be evaluated
     * @returns {EvaluatedAction} - The EvaluatedAction with the score and any targets
     * @memberof DefaultAI
     */
    private evaluateCard(card: Card): EvaluatedAction {
        let result: EvaluatedAction = { score: 0, cost: card.getCost().getNumeric(), card: card };
        if (card.getTargeter().needsInput()) {
            let best = this.getBestTarget(card);
            if (best.score > 0 || !card.getTargeter().isOptional())
                result = best;
        }
        if (card.getCardType() === CardType.Item) {
            result.host = this.getBestHost(card as Item);
        }
        result.score += card.evaluate(this.game, EvalContext.Play);
        return result;
    }

    /**
     * Creates an evaluated action from an enchantment.
     *
     * Currently the score is based on the ratio between the enchantments cost and its power.
     * @param enchantment - The enchantment to evaluate
     */
    private evaluateEnchantment(enchantment: Enchantment): EvaluatedAction {
        let modifyCost = enchantment.getModifyCost().getNumeric();
        let playCost = enchantment.getCost().getNumeric();
        return {
            enchantmentTarget: enchantment,
            cost: modifyCost,
            score: playCost / (modifyCost * enchantment.getPower())
        };
    }

    /**
     * Selects a series of actions to take.
     * Currently there are two actions, playing a card or modifying an enchantment.
     *
     * All actions have a energy cost thus to determine which ones to use we compute their heuristic values.
     * Then we use a knapsack algorithm to get the highest total value of actions with our available energy.
     *
     */
    private selectActions() {
        let playableCards = this.aiPlayer.getHand().filter(card => card.isPlayable(this.game));
        let modifiableEnchantments = this.getModifiableEnchantments();
        let energy = this.aiPlayer.getPool().getNumeric();
        let actions: EvaluatedAction[] = playableCards.map(card => {
            try {
                return this.evaluateCard(card);
            } catch (e) {
                console.error('Error while evaluating', card, 'got', e);
                return { score: 0, cost: 0 };
            }
        }).concat(modifiableEnchantments.map(enchantment => {
            return this.evaluateEnchantment(enchantment);
        }));

        let actionsToRun = Array.from(knapsack(energy, actions.map(action => {
            return {
                w: action.cost,
                b: action.score,
                data: action
            } as KnapsackItem<EvaluatedAction>;
        })).set).map(item => item.data);

        if (actionsToRun.length > 0) {
            this.runAction(maxBy(actionsToRun, evaluated => evaluated.score));
            this.addActionToSequence(this.selectActions, true);
        }
    }

    /** Plays a card based on an action */
    private runCardPlayAction(action: EvaluatedAction) {
        let targets: Unit[] = [];
        let host = action.host;
        let toPlay = action.card;
        if (action.target)
            targets.push(action.target);
        this.game.playCardExtern(toPlay, targets, host);
    }

    /** Runs an action (either playing a card or modifying an enchantment) */
    private runAction(action: EvaluatedAction) {
        if (action.card)
            this.runCardPlayAction(action);
        else if (action.enchantmentTarget)
            this.game.modifyEnchantment(this.aiPlayer, action.enchantmentTarget);
    }

    /** Returns the enchantments we have enough energy to empower or diminish */
    private getModifiableEnchantments() {
        let player = this.game.getPlayer(this.playerNumber);
        let res = player.getPool();
        return this.game.getBoard()
            .getAllEnchantments()
            .filter(enchant => res.meetsReq(enchant.getModifyCost()));
    }

    /**
     * Gets the best host for an item.
     * Currently it simply returns the unit with the highest value multiplier (ignoring the properties of the item).
     * @param item The item to find a host for
     */
    private getBestHost(item: Item): Unit {
        let units = this.game.getBoard().getPlayerUnits(this.playerNumber);
        return maxBy(units, unit => unit.getMultiplier(this.game, EvalContext.NonlethalRemoval));
    }

    /** Gets the difference in resources (not energy) between two values */
    private getReqDiff(current: Resource, needed: Resource) {
        let diffs = {
            total: 0,
            resources: new Map<string, number>()
        };
        for (let resourceType of ResourceTypeNames) {
            diffs.resources.set(resourceType, Math.max(needed.getOfType(resourceType) - current.getOfType(resourceType), 0));
            diffs.total += diffs.resources.get(resourceType);
        }
        return diffs;
    }


    /** Returns the card whose resource pre reqs are not met, but are the closest to being met */
    private getClosestUnmetRequirement(cards: Card[]) {
        return minBy(cards
            .filter(card => this.getReqDiff(this.aiPlayer.getPool(), card.getCost()).total !== 0),
            card => this.getReqDiff(this.aiPlayer.getPool(), card.getCost()).total
        );
    }

    /** Computes the most common resource among a set of cards (such as a deck or hand) */
    private getMostCommonResource(cards: Card[]) {
        let total = new Resource(0);
        for (let card of cards) {
            total.add(card.getCost());
        }
        return maxBy(ResourceTypeNames, type => total.getOfType(type));
    }

    /**
     * Decides what resource to play next based on the following heuristic.
     *
     * If the A.I has unplayable cards it in its hand, it looks at its hand and decides which
     * card it is closest to being able to play but is not yet able to. It chooses a resource
     * which gets it closer to playing that card.
     *
     * Otherwise it applies the same logic, but to its deck list.
     *
     * Finally, if it can play every card in its hand and deck, it simply plays the most common resource
     * in its deck (based on average card cost).
     *
     * @private
     * @returns - The name of the resource to play
     * @memberof DefaultAI
     */
    private getResourceToPlay() {
        let deckCards = this.deck.getUniqueCards();
        let closestCardInHand = this.getClosestUnmetRequirement(this.aiPlayer.getHand());
        let closestCardInDeck = this.getClosestUnmetRequirement(deckCards);
        let closestCard = closestCardInHand || closestCardInDeck;

        if (closestCard) {
            let diff = this.getReqDiff(this.aiPlayer.getPool(), closestCard.getCost());
            return maxBy(ResourceTypeNames, type => diff.resources.get(type));
        } else {
            return this.getMostCommonResource(deckCards);
        }
    }

    private playResource() {
        this.game.playResource(this.getResourceToPlay());
    }

    // Attacking/Blocking -------------------------------------------------------------------------

    /**
     * Chooses which, if any, units to attack with.
     * The A.I will choose to attack with any units it would not block if it were the opponent.
     * That is to say, any unit where the canFavorablyBlock function returns false for all enemy units.
     *
     * Known Flaws
     *  - The A.I should attack if it could guarantee lethal damage regardless of trades, but that is not implemented.
     *  - The A.I should consider potential multi-blocks from the enemy, but it dose not.
     *  - The A.I should consider whether it is best to leave a unit on defense, even if its a good attacker
     *    e.g if the enemy has much more life than us and attacking with that unit will give them good attacks.
     *
     * @private
     * @memberof DefaultAI
     */
    private attack() {
        let potentialAttackers = this.game.getBoard().getPlayerUnits(this.playerNumber)
            .filter(unit => unit.canAttack())
            .filter(unit => unit.getDamage() > 0);
        let potentialBlockers = this.game.getBoard().getPlayerUnits(this.enemyNumber)
            .filter(unit => !unit.isExhausted());

        for (let attacker of potentialAttackers) {
            let hasBlocker = false;
            for (let blocker of potentialBlockers) {
                if (this.canFavorablyBlock(attacker, blocker)) {
                    hasBlocker = true;
                    break;
                }
            }
            if (!hasBlocker) {
                this.game.declareAttacker(attacker);
            }
        }
    }

    /**
     * Analyzes whether a blocker can favorably block an attacker.
     * A block is considered favorable under any of the following circumstances
     *   1. Only the attacker would die
     *   2. Neither the attacker nor the blocker would die
     *   3. Both the attacker and the blocker die, but the attacker is more valuable than the blocker.
     *
     * Notably, this function cannot handle blocking with multiple units (even though that is legal).
     *
     * @private
     * @param {Unit} attacker - The attacking unit to consider blocking
     * @param {Unit} blocker - The blocker to consider
     * @returns
     * @memberof DefaultAI
     */
    private canFavorablyBlock(attacker: Unit, blocker: Unit) {
        if (!blocker.canBlockTarget(attacker, true))
            return false;
        let type = this.categorizeBlock(attacker, blocker);
        return type === BlockOutcome.AttackerDies ||
            type === BlockOutcome.NeitherDies ||
            (type === BlockOutcome.BothDie &&
                attacker.evaluate(this.game, EvalContext.LethalRemoval) > blocker.evaluate(this.game, EvalContext.LethalRemoval));
    }

    /** Categorizes a block by what its outcome will be (if the attacker, blocker or both will die) */
    private categorizeBlock(attacker: Unit, blocker: Unit): BlockOutcome {
        let isAttackerLethal = attacker.hasMechanicWithId(Lethal.getId()) ||
            attacker.hasMechanicWithId(TransformDamaged.getId());
        let isBlockerLethal = blocker.hasMechanicWithId(Lethal.getId()) ||
            blocker.hasMechanicWithId(TransformDamaged.getId());

        let shield = (attacker.hasMechanicWithId(Shielded.getId()) as Shielded);
        let isAttackerShielded = shield && !shield.isDepleted();
        shield = (blocker.hasMechanicWithId(Shielded.getId()) as Shielded);
        let isBlockerShielded = shield && !shield.isDepleted();

        let attackerDies = !isAttackerShielded && (isBlockerLethal || blocker.getDamage() >= attacker.getLife());
        let blockerDies = !isBlockerShielded && (isAttackerLethal || attacker.getDamage() >= blocker.getLife());

        if (attackerDies && blockerDies) {
            return BlockOutcome.BothDie;
        } else if (attackerDies) {
            return BlockOutcome.AttackerDies;
        } else if (blockerDies) {
            return BlockOutcome.BlockerDies;
        } else {
            return BlockOutcome.NeitherDies;
        }
    }

    /** Declares a blocker as blocking a particular attacker */
    private makeBlockAction(params: { blocker: Unit, attacker: Unit }) {
        return () => {
            this.game.declareBlocker(params.blocker, params.attacker);
        };
    }

    /**
     * Determines what units should block enemy attackers.
     *
     * If the enemy attack is potentially lethal, the A.I will focus on minimizing damage in the least disadvantageous way
     * but it will be willing to sacrifice units to block without trading (chump blocks).
     *
     * Otherwise the A.I will only make blocks considered to be favorable by the canFavorablyBlock function.
     *
     * Known Flaws
     *  - The A.I should consider chump blocking if its health is more valuable than the unit it would sacrifice.
     *  - The A.I should consider multi-blocks, but it dose not.
     *
     * @protected
     * @memberof DefaultAI
     */
    protected block() {
        let attackers = sortBy(this.game.getAttackers(), (attacker) =>
            -(attacker.getDamage() + (attacker.hasMechanicWithId(Flying.getId()) !== undefined ? 1000 : 0)));
        let potentialBlockers = this.game.getBoard().getPlayerUnits(this.playerNumber)
            .filter(unit => !unit.isExhausted());

        let totalDamage = sumBy(attackers, (attacker) => attacker.getDamage());
        let life = this.aiPlayer.getLife();
        let blocks = [];
        for (let attacker of attackers) {
            let options = [] as { blocker: Unit, attacker: Unit, type: BlockOutcome, tradeScore: number }[];
            for (let blocker of potentialBlockers) {
                if (blocker.canBlockTarget(attacker)) {
                    options.push({
                        blocker: blocker,
                        attacker: attacker,
                        type: this.categorizeBlock(attacker, blocker),
                        tradeScore: blocker.evaluate(this.game, EvalContext.LethalRemoval) -
                            attacker.evaluate(this.game, EvalContext.LethalRemoval)
                    });
                }
            }
            let best = minBy(options, option => option.type * 100000 + option.tradeScore);
            if (best !== undefined && (
                totalDamage >= life ||
                best.type < BlockOutcome.BothDie ||
                best.type === BlockOutcome.BothDie && best.tradeScore <= 0)
            ) {
                blocks.push(best);
                totalDamage -= best.attacker.getDamage();
                remove(potentialBlockers, (unit) => unit === best.blocker);
            }
        }
        let actions = blocks.map(block => {
            return this.makeBlockAction(block);
        });
        this.sequenceActions(actions);
    }

    /**
     * Executed when the phase changes.
     *
     * If the new phase is the block phase and we are the active player then we trigger blocking logic.
     * (this indicates we are being attacked)
     */
    private onPhaseChange(params: any) {
        if (!this.game.isActivePlayer(this.playerNumber))
            return;
        this.think();
    }
}
