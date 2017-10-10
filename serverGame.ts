import { Game, GamePhase, GameActionType, SyncEventType, GameAction, GameSyncEvent } from './game';
import { GameFormat, standardFormat } from './gameFormat';
import { CardType } from './card';
import { Item } from './item';
import { Unit } from './unit';
import { DeckList } from './deckList';
import { data } from './gameData';

type ActionCb = (act: GameAction) => boolean;
export class ServerGame extends Game {
    // A table of handlers used to respond to actions taken by players
    protected actionHandelers: Map<GameActionType, ActionCb>

    constructor(format: GameFormat = standardFormat, decks: [DeckList, DeckList]) {
        super(format, false, decks);
        this.actionHandelers = new Map<GameActionType, ActionCb>();
        this.addActionHandelers();
    }

    // Player Actions -----------------------------------------------------

    /**
   * Handles a players action and returns a list of events that
   * resulted from that aciton.
   * 
   * @param {GameAction} action 
   * @returns {GameSyncEvent[]} 
   * @memberof Game
   */
    public handleAction(action: GameAction): GameSyncEvent[] | null {
        let mark = this.events.length;
        let handeler = this.actionHandelers.get(action.type);
        if (!handeler)
            return [];
        if (action.type != GameActionType.CardChoice && this.waitingForPlayerChoice != null) {
            console.error('Cant take action, waiting for', this.waitingForPlayerChoice);
            return null;
        }
        let sig = handeler(action);
        if (sig != true)
            return null
        return this.events.slice(mark);
    }

    protected addActionHandeler(type: GameActionType, cb: ActionCb) {
        this.actionHandelers.set(type, cb.bind(this));
    }

    protected addActionHandelers() {
        this.addActionHandeler(GameActionType.Pass, this.passAction);
        this.addActionHandeler(GameActionType.PlayResource, this.playResourceAction);
        this.addActionHandeler(GameActionType.PlayCard, this.playCardAction);
        this.addActionHandeler(GameActionType.ToggleAttack, this.toggleAttackAction);
        this.addActionHandeler(GameActionType.DeclareBlocker, this.declareBlockerAction);
        this.addActionHandeler(GameActionType.CardChoice, this.cardChoiceAction);
        this.addActionHandeler(GameActionType.Quit, this.quit);
    }

    protected cardChoiceAction(act: GameAction): boolean {
        if (act.player != this.waitingForPlayerChoice) {
            console.error('Reject choice from', act.player, 'wanted', this.waitingForPlayerChoice);
            return false;
        }
        let cardIds = act.params.choice as string[];
        this.makeDeferedChoice(cardIds.map(id => this.getCardById(id)));
        this.addGameEvent(new GameSyncEvent(SyncEventType.ChoiceMade, {
            player: act.player,
            choice: act.params.choice
        }));
        return true;
    }

    /* Preconditions 
        - Its the owners turn
        - Owner has has card in hand, 
        - Owner can can afford to play card
        - The target given for the card is valid 
    */
    protected playCardAction(act: GameAction): boolean {
        let player = this.players[act.player];
        if (!this.isPlayerTurn(act.player))
            return false;
        let card = this.getPlayerCardById(player, act.params.id);
        if (!card || !card.isPlayable(this))
            return false;

        // Standard Targets
        let targets: Unit[] = act.params.targetIds.map((id: string) => this.getUnitById(id));
        card.getTargeter().setTargets(targets);
        if (!card.getTargeter().targetsAreValid(card, this))
            return false;

        // Item Host
        if (card.getCardType() == CardType.Item) {
            let item = card as Item;
            item.getHostTargeter().setTargets([this.getUnitById(act.params.hostId)]);
            if (!item.getHostTargeter().targetsAreValid(card, this))
                return false;
        }

        this.playCard(player, card);
        this.addGameEvent(new GameSyncEvent(SyncEventType.PlayCard, {
            playerNo: act.player,
            played: card.getPrototype(),
            targetIds: act.params.targetIds,
            hostId: act.params.hostId
        }));
        return true;
    }

    /* Preconditions 
        - It is the first phase of the acitng players turn
        - Unit is on the battlfield, 
        - Unit can attack
    */
    protected toggleAttackAction(act: GameAction): boolean {
        let player = this.players[act.player];
        let unit = this.getPlayerUnitById(act.player, act.params.unitId);
        if (!this.isPlayerTurn(act.player) || this.phase != GamePhase.Play1 || !unit || !unit.canAttack())
            return false;
        unit.toggleAttacking();
        this.addGameEvent(new GameSyncEvent(SyncEventType.AttackToggled, { player: act.player, unitId: act.params.unitId }));
        return true;
    }

    /* Preconditions 
       - It is the block phase of the opposing players turn
       - Unit is on the battlfield, 
       - Unit can attack
    */
    protected declareBlockerAction(act: GameAction) {
        let player = this.players[act.player];
        let blocker = this.getUnitById(act.params.blockerId);
        let blocked = this.getPlayerUnitById(this.turn, act.params.blockedId);
        if (this.isPlayerTurn(act.player) ||
            this.phase !== GamePhase.Block ||
            !blocker || !blocked || !blocker.canBlock(blocked))
            return false;
        blocker.setBlocking(blocked ? blocked.getId() : null);
        this.addGameEvent(new GameSyncEvent(SyncEventType.Block, {
            player: act.player,
            blockerId: act.params.blockerId,
            blockedId: act.params.blockedId
        }));
        return true;
    }

    /* Preconditions 
       - It is the acting player's turn
       - Player has not already played a resource
       - Requested resource type is valid
    */
    protected playResourceAction(act: GameAction): boolean {
        let player = this.players[act.player];
        if (!(this.isPlayerTurn(act.player) && player.canPlayResource()))
            return false;
        let res = this.format.basicResources.get(act.params.type);
        if (!res)
            return false;
        player.playResource(res);
        this.addGameEvent(new GameSyncEvent(SyncEventType.PlayResource, { playerNo: act.player, resource: res }));
        return true;
    }

    protected passAction(act: GameAction): boolean {
        if (!this.isActivePlayer(act.player)) {
            console.error('Cant pass, not active player player', this.getActivePlayer(), GamePhase[this.phase], this.turn);
            return false;
        }
        this.nextPhase();
        return true;
    }
}
