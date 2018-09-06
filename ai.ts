import { maxBy, minBy, remove, sampleSize, meanBy, sortBy, sumBy, take } from 'lodash';
import { LinkedList } from 'typescript-collections';
import { knapsack, KnapsackItem } from './algoritms';
import { Animator } from './animator';
import { Card, CardType } from './card';
import { TransformDamaged } from './cards/mechanics/decaySpecials';
// Mechanics to worry about
import { Flying, Lethal, Shielded } from './cards/mechanics/skills';
import { ClientGame } from './clientGame';
import { Enchantment } from './enchantment';
import { GamePhase, GameSyncEvent, SyncEventType } from './game';
import { Item } from './item';
import { EvalContext } from './mechanic';
import { Player } from './player';
import { Resource, ResourceTypeNames } from './resource';
import { Unit } from './unit';
import { DeckList } from './deckList';

export enum AiDifficulty {
    Easy, Medium, Hard
}

enum BlockType {
    AttackerDies, NeitherDies, BothDie, BlockerDies
}

export abstract class AI {
    constructor(
        protected playerNumber: number,
        protected game: ClientGame,
        protected deck: DeckList,
        protected animator: Animator
    ) { }

    abstract async handleGameEvent(event: GameSyncEvent): Promise<any>;
    abstract pulse(): void;
}

interface EvaluatedAction {
    score: number;
    cost: number;
    card?: Card;
    enchantmentTarget?: Enchantment;
    target?: Unit;
    host?: Unit;
}

export enum ChoiceHeuristic {
    DrawHeuristic,
    DiscardHeuristic,
    ReplaceHeuristic,
    HighestStatsHeuristic
}

export class BasicAI extends AI {
    private eventHandlers: Map<SyncEventType, (params: any) => void> = new Map();
    private enemyNumber: number;
    private aiPlayer: Player;
    private actionSequence: LinkedList<() => void> = new LinkedList<() => void>();

    constructor(playerNumber: number, game: ClientGame, deck: DeckList, animator: Animator) {
        super(playerNumber, game, deck, animator);
        this.aiPlayer = this.game.getPlayer(this.playerNumber);
        this.enemyNumber = this.game.getOtherPlayerNumber(this.playerNumber);

        this.game.promptCardChoice = this.makeChoice.bind(this);
        this.eventHandlers.set(SyncEventType.TurnStart, event => this.onTurnStart(event.params));
        this.eventHandlers.set(SyncEventType.PhaseChange, event => this.onPhaseChange(event.params));
        this.eventHandlers.set(SyncEventType.ChoiceMade, event => this.continue());
    }

    public pulse() {
        this.continue();
    }

    private addActionToSequence(action: () => void, front: boolean = false) {
        this.actionSequence.add(action.bind(this), front ? 0 : this.actionSequence.size());
    }

    private sequenceActions(actions: Array<() => void>) {
        this.actionSequence = new LinkedList<() => void>();
        for (let action of actions) {
            this.addActionToSequence(action);
        }
    }

    private dequeue(): () => void {
        let val = this.actionSequence.first();
        this.actionSequence.remove(val);
        return val;
    }

    private continue() {
        if (this.animator.isAnimiating())
            return;
        if (!this.game.canTakeAction() || !this.game.isActivePlayer(this.playerNumber))
            return;
        let next = this.dequeue() || this.game.pass.bind(this.game);
        next();
    }

    private cardDrawHeuristic(card: Card): number {
        return Math.abs(this.aiPlayer.getPool().getNumeric() - card.getCost().getNumeric());
    }

    private evaluateToDraw(choices: Card[], min: number, max: number): Card[] {
        return take(sortBy(choices, card =>
            this.cardDrawHeuristic(card)
        ), max);
    }

    private evaluateToDiscard(choices: Card[], min: number, max: number): Card[] {
        return take(sortBy(choices, card =>
            -this.cardDrawHeuristic(card)
        ), min);
    }

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

    private highestStatHeuristic(choices: Card[], min: number, max: number): Card[] {
        return take(sortBy(choices as Unit[], unit => -unit.getStats()), max);
    }

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

    private getCardToChoose(options: Array<Card>, min: number = 1, max: number = 1, heuristicType: ChoiceHeuristic) {
        if (options.length < min)
            return options;
        let evaluator = this.getHeuristic(heuristicType);
        return evaluator(options, min, max);
    }

    private makeChoice(
        player: number, options: Array<Card>, min: number = 1, max: number = 1,
        callback: (cards: Card[]) => void = null,
        message: string,
        heuristicType: ChoiceHeuristic
    ) {
        console.log('ai', player);
        if (!callback) {
            return;
        }
        this.game.deferChoice(player, options, min, max, callback);
        if (player !== this.playerNumber) {
            return;
        }
        this.game.makeChoice(this.playerNumber, this.getCardToChoose(options, min, max, heuristicType));
    }

    public async handleGameEvent(event: GameSyncEvent) {
        await this.game.syncServerEvent(this.playerNumber, event);
        if (this.eventHandlers.has(event.type))
            this.eventHandlers.get(event.type)(event);
    }

    private onTurnStart(params: any) {
        console.log('ai ots', params, this.playerNumber);
        if (this.playerNumber !== params.turn)
            return;
        this.playResource();
        this.sequenceActions([this.selectActions, this.attack]);
    }

    private getBestTarget(card: Card): EvaluatedAction {
        let targets = card.getTargeter().getValidTargets(card, this.game);
        if (targets.length === 0)
            return { score: 0, cost: card.getCost().getNumeric(), card: card };
        let best = maxBy(targets, target => card.evaluateTarget(target, this.game));
        return { target: best, score: card.evaluateTarget(best, this.game), cost: card.getCost().getNumeric(), card: card };
    }

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

    private evaluateEnchantment(enchantment: Enchantment): EvaluatedAction {
        let modifyCost = enchantment.getModifyCost().getNumeric();
        let playCost = enchantment.getCost().getNumeric();
        return {
            enchantmentTarget: enchantment,
            cost: modifyCost,
            score: playCost / (modifyCost * enchantment.getPower())
        };
    }

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

    private runCardPlayAction(action: EvaluatedAction) {
        let targets: Unit[] = [];
        let host = action.host;
        let toPlay = action.card;
        if (action.target)
            targets.push(action.target);
        this.game.playCardExtern(toPlay, targets, host);
    }

    private runAction(action: EvaluatedAction) {
        if (action.card)
            this.runCardPlayAction(action);
        else if (action.enchantmentTarget)
            this.game.modifyEnchantment(this.aiPlayer, action.enchantmentTarget);
    }

    private getModifiableEnchantments() {
        let player = this.game.getPlayer(this.playerNumber);
        let res = player.getPool();
        return this.game.getBoard()
            .getAllEnchantments()
            .filter(enchant => res.meetsReq(enchant.getModifyCost()));
    }

    private getBestHost(item: Item): Unit {
        let units = this.game.getBoard().getPlayerUnits(this.playerNumber);
        return maxBy(units, unit => unit.getMultiplier(this.game, EvalContext.NonlethalRemoval));
    }

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


    // Returns the card whose resource prereqs are not met, but are the closest to being met
    private getClosestUnmetRequirment(cards: Card[]) {
        return minBy(cards
            .filter(card => this.getReqDiff(this.aiPlayer.getPool(), card.getCost()).total !== 0),
            card => this.getReqDiff(this.aiPlayer.getPool(), card.getCost()).total
        );
    }

    private getMostCommonResource(cards: Card[]) {
        let total = new Resource(0);
        for (let card of cards) {
            total.add(card.getCost());
        }
        return maxBy(ResourceTypeNames, type => total.getOfType(type));
    }

    private getResourceToPlay() {
        let deckCards = this.deck.getUniqueCards();
        let closestCardInHand = this.getClosestUnmetRequirment(this.aiPlayer.getHand());
        let closestCardInDeck = this.getClosestUnmetRequirment(deckCards);
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
    private attack() {
        let potentialAttackers = this.game.getBoard().getPlayerUnits(this.playerNumber)
            .filter(unit => unit.canAttack())
            .filter(unit => unit.getDamage() > 0);
        let potentialBlockers = this.game.getBoard().getPlayerUnits(this.enemyNumber)
            .filter(unit => !unit.isExausted());

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

    private canFavorablyBlock(attacker: Unit, blocker: Unit) {
        if (!blocker.canBlockTarget(attacker, true))
            return false;
        let type = this.categorizeBlock(attacker, blocker);
        return type === BlockType.AttackerDies ||
            type === BlockType.NeitherDies ||
            (type === BlockType.BothDie &&
                attacker.evaluate(this.game, EvalContext.LethalRemoval) > blocker.evaluate(this.game, EvalContext.LethalRemoval));
    }

    private categorizeBlock(attacker: Unit, blocker: Unit): BlockType {
        let isAttackerLethal = attacker.hasMechanicWithId(Lethal.getId()) ||
            attacker.hasMechanicWithId(TransformDamaged.getId());
        let isBlockerLethal = blocker.hasMechanicWithId(Lethal.getId()) ||
            blocker.hasMechanicWithId(TransformDamaged.getId());

        let shield = (attacker.hasMechanicWithId(Shielded.getId()) as Shielded);
        let isAttackerShilded = shield && !shield.isDepleted();
        shield = (blocker.hasMechanicWithId(Shielded.getId()) as Shielded);
        let isBlockerShilded = shield && !shield.isDepleted();

        let attackerDies = !isAttackerShilded && (isBlockerLethal || blocker.getDamage() >= attacker.getLife());
        let blockerDies = !isBlockerShilded && (isAttackerLethal || attacker.getDamage() >= blocker.getLife());

        if (attackerDies && blockerDies) {
            return BlockType.BothDie;
        } else if (attackerDies) {
            return BlockType.AttackerDies;
        } else if (blockerDies) {
            return BlockType.BlockerDies;
        } else {
            return BlockType.NeitherDies;
        }
    }

    private makeBlockAction(params: { blocker: Unit, attacker: Unit }) {
        return () => {
            this.game.declareBlocker(params.blocker, params.attacker);
        };
    }

    private block() {
        let attackers = sortBy(this.game.getAttackers(), (attacker) =>
            -(attacker.getDamage() + (attacker.hasMechanicWithId(Flying.getId()) !== undefined ? 1000 : 0)));
        let potentialBlockers = this.game.getBoard().getPlayerUnits(this.playerNumber)
            .filter(unit => !unit.isExausted());

        let totalDamage = sumBy(attackers, (attacker) => attacker.getDamage());
        let life = this.aiPlayer.getLife();
        let blocks = [];
        for (let attacker of attackers) {
            let options = [] as { blocker: Unit, attacker: Unit, type: BlockType, tradeScore: number }[];
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
                best.type < BlockType.BothDie ||
                best.type === BlockType.BothDie && best.tradeScore <= 0)
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

    private onPhaseChange(params: any) {
        if (!this.game.isActivePlayer(this.playerNumber))
            return;
        if (params.phase === GamePhase.Block)
            this.block();

    }
}

