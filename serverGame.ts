import { isArray } from 'util';
import { CardType, Card } from './card';
import { DeckList } from './deckList';
import { Enchantment } from './enchantment';
import { Game, GamePhase } from './game';
import { GameFormat, standardFormat } from './gameFormat';
import { Item } from './item';
import { Player } from './player';
import { Unit } from './unit';
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

export class ServerGame extends Game {
    private static rng: Prando;
    protected actionSystem = new GameActionSystem(this);

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
            (this.currentChoices[0] !== null || this.currentChoices[1] !== null)
        ) {
            console.error(
                `Cant take action, ${GameActionType[action.type]} waiting for`,
                this.currentChoices
            );
            return null;
        }
        const sig = this.actionSystem.handleAction(action);

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
        const defenders = new Set(
            this.attackDamageOrder.get(act.attackerID).map(u => u.getId())
        );
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
        if (this.currentChoices[act.player] === null) {
            console.error('Reject choice from', act.player);
            return false;
        }
        const cardIds = act.choice as string[];
        const cards = cardIds.map(id => this.getCardById(id));
        const min = Math.min(
            this.currentChoices[act.player].validCards.size,
            this.currentChoices[act.player].min
        );
        const max = this.currentChoices[act.player].max;
        if (cards.length > max || cards.length < min) {
            console.error(
                `Reject choice. Wanted between ${min} and ${max} cards but got ${
                    cards.length
                }.`
            );
            return false;
        }
        if (
            !cards.every(card =>
                this.currentChoices[act.player].validCards.has(card)
            )
        ) {
            console.error(
                `Reject choice. Included invalid options.`,
                cards,
                this.currentChoices[act.player].validCards
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
        const unit = this.getPlayerUnitById(act.player, act.unitId);
        if (
            !this.isPlayerTurn(act.player) ||
            this.phase !== GamePhase.Play1 ||
            !unit ||
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
    }

    /* Preconditions
       - It is the block phase of the opposing players turn
       - Unit is on the battlefield,
       - Unit can attack
    */
    protected declareBlockerAction(act: DeclareBlockerAction) {
        const player = this.players[act.player];
        const isCanceling = act.blockedId === null;
        const blocker = this.getUnitById(act.blockerId);
        const blocked = isCanceling
            ? null
            : this.getPlayerUnitById(this.turn, act.blockedId);
        if (
            this.isPlayerTurn(act.player) ||
            this.phase !== GamePhase.Block ||
            !blocker
        ) {
            return false;
        }
        if (!isCanceling && (!blocked || !blocker.canBlockTarget(blocked))) {
            return false;
        }
        blocker.setBlocking(isCanceling ? null : blocked.getId());
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
                } Can't pass, they are not thee active player (
                ${this.getActivePlayer()} is)`,
                GamePhase[this.phase],
                this.turn
            );
            return false;
        }
        this.nextPhase();
        return true;
    }
}
