import { isArray } from 'util';
import { CardType, Card } from './card-types/card';
import { DeckList, SavedDeck } from './deckList';
import { Enchantment } from './card-types/enchantment';
import { Game, GamePhase } from './game';
import { GameFormat, standardFormat } from './gameFormat';
import { Item } from './card-types/item';
import { Player } from './player';
import { Unit } from './card-types/unit';
import Prando from 'prando';
import { GameSyncEvent, SyncEventType } from './events/syncEvent';
import {
    GameActionSystem,
    GameActionType,
    GameAction,
    PassAction,
    PlayResourceAction,
    DeclareBlockerAction,
    ToggleAttackAction,
    PlayCardAction,
    CardChoiceAction,
    ModifyEnchantmentAction,
    DistributeDamageAction
} from './events/gameAction';

export interface GameReplay {
    seed: string | number;
    actions: GameAction[];
    deckLists: [SavedDeck, SavedDeck];
    winner: number;
}

export class ServerGame extends Game {
    private static rng: Prando;
    private static seed: string | number;
    protected actionSystem = new GameActionSystem(this);

    // Replay information
    protected seed: string | number = 0;
    protected actionLog: GameAction[] = [];
    protected deckLists: [DeckList, DeckList];

    public static setSeed(seed: string | number) {
        this.rng = new Prando(seed);
    }

    constructor(
        name: string,
        format: GameFormat = standardFormat,
        deckLists: [DeckList, DeckList]
    ) {
        super(name, format);
        this.addActionHandlers();

        this.seed = ServerGame.seed;
        this.deckLists = deckLists;

        const decks = deckLists.map(deckList => {
            const deck = deckList.toDeck().map(fact => {
                const card = fact();
                this.cardPool.set(card.getId(), card);
                return card;
            });
            return this.shuffle(deck);
        });

        this.players = [
            new Player(
                this,
                decks[0],
                0,
                this.format.initialResource[0],
                this.format.initialLife[0]
            ),
            new Player(
                this,
                decks[1],
                1,
                this.format.initialResource[1],
                this.format.initialLife[1]
            )
        ];

        this.addDeathHandlers();
    }

    public getReplay(): GameReplay {
        return {
            seed: this.seed,
            actions: [...this.actionLog],
            deckLists: [...this.deckLists.map(deck => deck.getSavable())] as [
                SavedDeck,
                SavedDeck
            ],
            winner: this.getWinner()
        };
    }

    public getResponsiblePlayer() {
        if (
            this.currentChoices[0] === null &&
            this.currentChoices[1] === null
        ) {
            return this.getActivePlayer();
        } else if (
            this.currentChoices[0] !== null &&
            this.currentChoices[0] !== null
        ) {
            return ServerGame.rng.nextInt(0, 1);
        } else if (this.currentChoices[0] !== null) {
            return 0;
        } else {
            return 1;
        }
    }

    public shuffle<T>(items: T[]): T[] {
        const copies = [...items];
        const end = copies.length - 1;
        for (let i = 0; i < end; i++) {
            const swapPos = ServerGame.rng.nextInt(i + 1, end);
            const temp = copies[swapPos];
            copies[swapPos] = copies[i];
            copies[i] = temp;
        }
        return copies;
    }

    public startGame() {
        this.turn = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].drawCards(this.format.initialDraw[i]);
        }
        this.players[this.turn].startTurn();
        this.getCurrentPlayerUnits().forEach(unit => unit.refresh());
        this.phase = GamePhase.Play1;

        this.mulligan();

        this.addGameEvent({
            type: SyncEventType.TurnStart,
            turn: this.turn,
            turnNum: this.turnNum
        });
        return [...this.events];
    }

    // Server side phase logic
    protected endPhaseOne() {
        if (this.isAttacking()) {
            this.gameEvents.playerAttacked.trigger({
                target: this.getOtherPlayerNumber(this.getActivePlayer())
            });
            if (this.blockersExist()) {
                this.changePhase(GamePhase.Block);
            } else {
                this.resolveCombat();
            }
        } else {
            this.startEndPhase();
        }
    }

    protected endBlockPhase() {
        const damageDistribution = this.generateDamageDistribution();
        const reorderables = this.getModableDamageDistributions();
        if (reorderables.size > 0) {
            this.changePhase(GamePhase.DamageDistribution);
        } else {
            this.resolveCombat();
        }
    }

    protected nextPhase() {
        switch (this.phase) {
            case GamePhase.Play1:
                this.endPhaseOne();
                break;
            case GamePhase.Play2:
                this.startEndPhase();
                break;
            case GamePhase.Block:
                this.endBlockPhase();
                break;
            case GamePhase.DamageDistribution:
                this.resolveCombat();
                break;
        }
    }

    public queryCards(
        getCards: (game: ServerGame) => Card[],
        callback: (cards: Card[]) => void
    ) {
        const cards = getCards(this);
        callback(cards);
        this.addGameEvent({
            type: SyncEventType.QueryResult,
            cards: cards.map(card => card.getPrototype())
        });
    }

    // Player Actions -----------------------------------------------------

    /**
     * Handles a players action and returns a list of events that
     * resulted from that action.
     *
     */
    public handleAction(action: GameAction): GameSyncEvent[] | null {
        const mark = this.events.length;
        if (
            action.type !== GameActionType.CardChoice &&
            action.type !== GameActionType.Quit &&
            (this.currentChoices[0] !== null || this.currentChoices[1] !== null)
        ) {
            console.error(
                `Cant take action, ${GameActionType[action.type]} waiting for`,
                this.currentChoices
            );
            return null;
        }
        const sig = this.actionSystem.handleAction(action);
        this.actionLog.push(action);
        if (sig !== true) {
            return null;
        }
        return this.events.slice(mark);
    }

    protected addActionHandlers() {
        this.actionSystem.addHandler(GameActionType.Pass, this.passAction);
        this.actionSystem.addHandler(
            GameActionType.PlayResource,
            this.playResourceAction
        );
        this.actionSystem.addHandler(
            GameActionType.PlayCard,
            this.playCardAction
        );
        this.actionSystem.addHandler(
            GameActionType.ToggleAttack,
            this.toggleAttackAction
        );
        this.actionSystem.addHandler(
            GameActionType.DeclareBlocker,
            this.declareBlockerAction
        );
        this.actionSystem.addHandler(
            GameActionType.CardChoice,
            this.cardChoiceAction
        );
        this.actionSystem.addHandler(
            GameActionType.ModifyEnchantment,
            this.modifyEnchantmentAction
        );
        this.actionSystem.addHandler(
            GameActionType.DistributeDamage,
            this.distributeDamageAction
        );
        this.actionSystem.addHandler(GameActionType.Quit, this.quit);
    }

    protected distributeDamageAction(act: DistributeDamageAction): boolean {
        if (!this.attackDamageOrder) {
            throw new Error(
                'Cannot distributed damage when damage order is undefined'
            );
        }
        if (
            !this.isPlayerTurn(act.player) ||
            this.phase !== GamePhase.DamageDistribution
        ) {
            return false;
        }
        if (!isArray(act.order)) {
            return false;
        }
        if (!this.attackDamageOrder.has(act.attackerID)) {
            return false;
        }
        const attackerBlockers = this.attackDamageOrder.get(act.attackerID);
        if (!attackerBlockers) {
            throw new Error('No blockers for ' + act.attackerID);
        }
        const defenders = new Set(attackerBlockers.map(u => u.getId()));
        const order = act.order as string[];
        if (defenders.size !== order.length) {
            return false;
        }
        for (const defender of order) {
            if (!defenders.has(defender)) {
                return false;
            }
        }
        this.attackDamageOrder.set(
            act.attackerID,
            order.map(id => this.getUnitById(id))
        );
        this.addGameEvent({
            type: SyncEventType.DamageDistributed,
            attackerID: act.attackerID,
            order: act.order
        });
        return true;
    }

    protected modifyEnchantmentAction(act: ModifyEnchantmentAction): boolean {
        if (!this.isPlayerTurn(act.player)) {
            return false;
        }
        const enchantment = this.getCardById(act.enchantmentId) as Enchantment;
        if (
            !enchantment ||
            enchantment.getCardType() !== CardType.Enchantment ||
            !enchantment.canChangePower(this.getCurrentPlayer(), this)
        ) {
            return false;
        }
        enchantment.empowerOrDiminish(this.getCurrentPlayer(), this);
        this.addGameEvent({
            type: SyncEventType.EnchantmentModified,
            enchantmentId: act.enchantmentId
        });
        return true;
    }

    protected cardChoiceAction(act: CardChoiceAction): boolean {
        const choices = this.currentChoices[act.player];
        if (choices === null) {
            console.error('Reject choice from', act.player);
            return false;
        }
        const cardIds = act.choice as string[];
        const cards = cardIds.map(id => this.getCardById(id));
        const min = Math.min(choices.validCards.size, choices.min);
        const max = choices.max;
        if (cards.length > max || cards.length < min) {
            console.error(
                this.name,
                `Reject choice. Wanted between ${min} and ${max} cards but got ${
                    cards.length
                }.`
            );
            return false;
        }
        if (!cards.every(card => choices.validCards.has(card))) {
            console.error(
                this.name,
                `Reject choice. Included invalid options.`,
                cards,
                choices.validCards
            );
            return false;
        }
        this.makeDeferredChoice(act.player, cards);
        this.addGameEvent({
            type: SyncEventType.ChoiceMade,
            player: act.player,
            choice: act.choice
        });
        return true;
    }

    /* Preconditions
        - Its the owners turn
        - Owner has has card in hand,
        - Owner can can afford to play card
        - The target given for the card is valid
    */
    protected playCardAction(act: PlayCardAction): boolean {
        const player = this.players[act.player];
        if (!this.isPlayerTurn(act.player)) {
            return false;
        }
        const card = this.getPlayerCardById(player, act.id);
        if (!card || !card.isPlayable(this)) {
            return false;
        }

        // Standard Targets
        const targets: Unit[] = act.targetIds.map((id: string) =>
            this.getUnitById(id)
        );
        card.getTargeter().setTargets(targets);
        if (!card.getTargeter().targetsAreValid(card, this)) {
            return false;
        }

        // Item Host
        if (card.getCardType() === CardType.Item) {
            if (!act.hostId) {
                return false;
            }
            const item = card as Item;
            item.getHostTargeter().setTargets([this.getUnitById(act.hostId)]);
            if (!item.getHostTargeter().targetsAreValid(card, this)) {
                return false;
            }
        }

        this.playCard(player, card);
        this.addGameEvent({
            type: SyncEventType.PlayCard,
            playerNo: act.player,
            played: card.getPrototype(),
            targetIds: act.targetIds,
            hostId: act.hostId
        });
        return true;
    }

    /* Preconditions
        - It is the first phase of the acting players turn
        - Unit is on the battlefield,
        - Unit can attack
    */
    protected toggleAttackAction(act: ToggleAttackAction): boolean {
        try {
            const unit = this.getPlayerUnitById(act.player, act.unitId);
            if (
                !this.isPlayerTurn(act.player) ||
                this.phase !== GamePhase.Play1 ||
                !unit.canAttack()
            ) {
                return false;
            }
            unit.toggleAttacking();
            this.addGameEvent({
                type: SyncEventType.AttackToggled,
                player: act.player,
                unitId: act.unitId
            });
            return true;
        } catch {
            return false;
        }
    }

    /* Preconditions
       - It is the block phase of the opposing players turn
       - Unit is on the battlefield,
       - Unit can attack
    */
    protected declareBlockerAction(act: DeclareBlockerAction) {
        const blocker = this.getUnitById(act.blockerId);
        if (
            this.isPlayerTurn(act.player) ||
            this.phase !== GamePhase.Block ||
            !blocker
        ) {
            return false;
        }

        if (act.blockedId === null) {
            blocker.setBlocking(null);
        } else {
            const blocked = this.getPlayerUnitById(this.turn, act.blockedId);
            blocker.setBlocking(blocked.getId());
            if (!blocked || !blocker.canBlockTarget(blocked)) {
                return false;
            }
        }

        this.addGameEvent({
            type: SyncEventType.Block,
            player: act.player,
            blockerId: act.blockerId,
            blockedId: act.blockedId
        });
        return true;
    }

    /* Preconditions
       - It is the acting player's turn
       - Player has not already played a resource
       - Requested resource type is valid
    */
    protected playResourceAction(act: PlayResourceAction): boolean {
        const player = this.players[act.player];
        if (!(this.isPlayerTurn(act.player) && player.canPlayResource())) {
            return false;
        }
        const res = this.format.basicResources.get(act.resourceType);
        if (!res) {
            return false;
        }
        player.playResource(res);
        this.addGameEvent({
            type: SyncEventType.PlayResource,
            playerNo: act.player,
            resource: res
        });
        return true;
    }

    protected passAction(act: PassAction): boolean {
        if (!this.isActivePlayer(act.player)) {
            console.error(
                `Player ${
                    act.player
                } Can't pass, they are not the active player ${this.getActivePlayer()} is`,
                GamePhase[this.phase],
                this.turn
            );
            return false;
        }
        this.nextPhase();
        return true;
    }
}
