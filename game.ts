import { Board } from './board';
import { Player } from './player';
import { Card, Location } from './card';
import { Unit } from './unit';
import { GameFormat, standardFormat } from './gameFormat';
import { DeckList } from './deckList';
import { Resource } from './resource';
import { GameEvent, EventType, EventGroup } from './gameEvent';
import { data } from './gameData';
import { Log } from './log';

import { shuffle } from 'lodash';

export enum GamePhase {
    Play1, Block, Play2, End, Response
}

export enum GameActionType {
    Mulligan, PlayResource, PlayCard, Pass, Concede, ActivateAbility,
    ToggleAttack, DeclareBlocker, DistributeDamage, CardChoice, Quit
}

export enum SyncEventType {
    Start, AttackToggled, TurnStart, PhaseChange, PlayResource, Mulligan,
    PlayCard, Block, Draw, ChoiceMade, QueryResult, Ended
}

export interface GameAction {
    type: GameActionType,
    player: number,
    params: any
}

export class GameSyncEvent {
    constructor(public type: SyncEventType, public params: any) { }
}

type ActionCb = (act: GameAction) => boolean;
export class Game {
    // Id of the game on the server
    public id: string;
    // A board containing units in play
    private board: Board;
    // Where dead cards go
    private crypt: [Card[], Card[]];
    // The number of player whose turn it currently is
    private turn: number;
    // The number of turns that have passed from the games start
    private turnNum: number;
    // The players playing the game
    private players: Player[];
    // The format of the game
    private format: GameFormat;
    // The phase of the current players turn (eg main phase, attack phase)
    private phase: GamePhase;
    // The previous phase (used to return from responce phases)
    private lastPhase: GamePhase;
    // A table of handlers used to respond to actions taken by players
    private actionHandelers: Map<GameActionType, ActionCb>
    // A list of all events that have taken place this game and need to be sent to clients
    private events: GameSyncEvent[];
    // A list of  units currently attacking
    private attackers: Unit[];
    // A list of blocks by the defending player
    private blockers: [Unit, Unit][];
    // A map of cards loaded from the server so far
    private cardPool: Map<string, Card>;
    // A group of game logic events that are not connected to any individual unit
    public gameEvents: EventGroup;
    // A callback to be run when the result of a player's choice becomes known
    private deferedChoice: (cards: Card[]) => void;
    // Flag to tell us which player's choice we are waiting for (null if not waiting)
    private waitingForPlayerChoice: number | null = null;
    // Handlers to syncronize events
    private syncEventHandlers: Map<SyncEventType, (playerNo: number,  event: GameSyncEvent, params:any) => void>;

    /**
     * Constructs a game given a format. The format
     * informs how the game is initlized eg how
     * much health each player starts with.
     * 
     * @param {any} [format=standardFormat] 
     * @memberof Game
     */
    constructor(format = standardFormat, private client: boolean = false, private log?: Log, deckLists?: [DeckList, DeckList]) {
        this.format = format;
        this.board = new Board(this.format.playerCount, this.format.boardSize);
        this.cardPool = new Map<string, Card>();
        this.turnNum = 1;
        this.events = [];
        this.attackers = [];
        this.blockers = [];
        this.crypt = [[], []];
        this.gameEvents = new EventGroup();

        if (log)
            log.attachToGame(this);

        let decks: Card[][] = [[], []];
        if (!client) {
            decks = deckLists.map(deckList => {
                let deck = deckList.toDeck().map(fact => {
                    let card = fact();
                    this.cardPool.set(card.getId(), card);
                    return card;
                })
                return shuffle(deck);
            })
        }

        this.players = [
            new Player(this, decks[0], 0, this.format.initalResource[0], this.format.initialLife[0]),
            new Player(this, decks[1], 1, this.format.initalResource[1], this.format.initialLife[1])
        ];

        this.players.forEach((player, number) => {
            player.getEvents().addEvent(null, new GameEvent(EventType.Death, (params) => {
                this.endGame(this.getOtherPlayerNumber(number));
                return params;
            }))
        })

        if (client) {
            this.players.forEach(player => player.disableDraw());
        }

        this.promptCardChoice = this.deferChoice;

        this.actionHandelers = new Map<GameActionType, ActionCb>();
        this.addActionHandelers();
        this.syncEventHandlers = new Map<SyncEventType, (playerNo: number, event: GameSyncEvent) => void>();
        this.addSyncHandlers();
    }

    // Game End Logic -----------------------------------------------
    private winner = -1;
    private endGame(winningPlayer: number, quit: boolean = false) {
        if (this.winner != -1)
            return;
        this.winner = winningPlayer;
        this.addGameEvent(new GameSyncEvent(SyncEventType.Ended, { winner: winningPlayer, quit: quit }));
    }

    private quit(action: GameAction) {
        this.endGame(this.getOtherPlayerNumber(action.player), true);
        return true;
    }

    /**
    * 
    * Returns the number of the player who has won the game.
    * If it is still in progress it will return -1;
    * 
    * @returns 
    * @memberof Game
    */
    public getWinner() {
        return this.winner;
    }

    // Synchronization --------------------------------------------------------
    public addGameEvent(event: GameSyncEvent) {
        this.events.push(event);
    }

    /**
     * Syncs an event that happened on the server into the state of this game model
     * 
     * @param {number} playerNumber 
     * @param {GameSyncEvent} event 
     * @memberof Game
     */
    public syncServerEvent(playerNumber: number, event: GameSyncEvent) {
        let params = event.params;
        this.events.push(event);
        let handler = this.syncEventHandlers.get(event.type);
        console.log(event, 'handle', SyncEventType[event.type], 'with', handler);
        if (handler)
            handler(playerNumber, event, params);
    }

    public idsToCards(ids: Array<string>) {
        return ids.map(id => this.getCardById(id));
    }

    public unpackCard(proto: { id: string, data: string, owner: number }) {
        if (this.cardPool.has(proto.id))
            return this.cardPool.get(proto.id);
        let card = data.getCard(proto.data);
        card.setId(proto.id);
        card.setOwner(proto.owner);
        this.cardPool.set(proto.id, card);
        return card;
    }

    private addSyncHandler(type: SyncEventType, cb: (playerNo: number, event: GameSyncEvent, params: any) => void) {
        this.syncEventHandlers.set(type, cb.bind(this));
    }

    private addSyncHandlers() {
        this.addSyncHandler(SyncEventType.PlayCard, this.syncCardEvent);
        this.addSyncHandler(SyncEventType.Draw, this.syncDrawEvent);
        this.addSyncHandler(SyncEventType.PlayResource, this.syncPlayResource);
        this.addSyncHandler(SyncEventType.AttackToggled, this.syncAttackToggled);
        this.addSyncHandler(SyncEventType.Block, this.syncBlock);
        this.addSyncHandler(SyncEventType.TurnStart, this.syncTurnStart);
        this.addSyncHandler(SyncEventType.PhaseChange, this.syncPhaseChange);
        this.addSyncHandler(SyncEventType.ChoiceMade, this.syncChoiceMade);
        this.addSyncHandler(SyncEventType.QueryResult, this.syncQueryResult);
        this.addSyncHandler(SyncEventType.Ended, this.syncEnded);
    }

    public syncCardEvent(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.playerNo != playerNumber) {
            let player = this.players[params.playerNo];
            let card = this.unpackCard(params.played)
            if (params.targetIds)
                card.getTargeter().setTargets(params.targetIds
                    .map((id: string) => this.getUnitById(id)));
            this.playCard(player, card);
        }
        if (this.log)
            this.log.addCardPlayed(event);
    }

    public syncDrawEvent(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.discarded)
            this.addToCrypt(this.unpackCard(params.card));
        else
            this.players[params.playerNo].addToHand(this.unpackCard(params.card))
    }

    public syncTurnStart(playerNumber: number, event: GameSyncEvent, params: any) {
        if (this.turnNum == 1) {
            this.turn = params.turn;
            this.turnNum = params.turnNum
            this.refresh();
        }
    }

    public syncPlayResource(playerNumber: number, event: GameSyncEvent, params: any) {
        this.players[params.playerNo].playResource(params.resource);
    }

    public syncAttackToggled(playerNumber: number, event: GameSyncEvent, params: any) {
        if (!this.getUnitById(params.unitId))
            console.error('Cand find attacking unit with id', params.unitId, params, 'i see units', this.getBoard().getAllUnits())
        if (params.player != playerNumber)
            this.getUnitById(params.unitId).toggleAttacking();
    }

    public syncBlock(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player != playerNumber) {
            if (!this.getUnitById(params.blockerId))
                console.error('Cand find blocker unitwith id', params.blockerId, params, 'i see units', this.getBoard().getAllUnits());
            if (!this.getUnitById(params.blockedId))
                console.error('Cand find blocked unit with id', params.blockedId, params, 'i see units', this.getBoard().getAllUnits());
            this.getUnitById(params.blockerId).setBlocking(params.blockedId);
        }
    }

    public syncPhaseChange(playerNumber: number, event: GameSyncEvent, params: any) {
        if (event.params.phase === GamePhase.Play2)
            this.resolveCombat();
        if (event.params.phase === GamePhase.End)
            this.startEndPhase();
        else
            this.changePhase(event.params.phase);
    }

    public syncChoiceMade(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player != playerNumber)
            this.makeDeferedChoice(this.idsToCards(params.choice));
    }

    public syncQueryResult(playerNumber: number, event: GameSyncEvent, params: any) {
        let cards = params.cards.map((proto: { id: string, data: string, owner: number }) => this.unpackCard(proto));
        this.setQueryResult(cards);
    }

    public syncEnded(playerNumber: number, event: GameSyncEvent, params: any) {
        this.winner = event.params.winner;
    }
   

    // Player choice =--------------------------------------------------------
    private deferChoice(player: number, choices: Card[], count: number, callback: (cards: Card[]) => void) {
        this.setDeferedChoice(player, callback);
    }

    public setDeferedChoice(player: number, callback: (cards: Card[]) => void) {
        if (callback != null) {
            this.deferedChoice = callback;
            this.waitingForPlayerChoice = player;
        }
    }

    public promptCardChoice: (player: number, choices: Card[], count: number, callback: (cards: Card[]) => void, message: string) => void;

    public makeDeferedChoice(cards: Card[]) {
        if (this.deferedChoice != null) {
            this.deferedChoice(cards);
        } else {
            console.error('Error, no defered choice handler for', cards);
        }
        this.waitingForPlayerChoice = null;
    }

    // Crypt logic ----------------------------------------------------
    public addToCrypt(card: Card) {
        card.setLocation(Location.Crypt);
        this.crypt[card.getOwner()].push(card);
    }

    public getCrypt(player: number) {
        return this.crypt[player];
    }

    // Game Logic -----------------------------------------------------
    public startGame() {
        this.turn = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].drawCards(this.format.initialDraw[i]);
        }
        this.players[this.turn].startTurn();
        this.getCurrentPlayerUnits().forEach(unit => unit.refresh());
        this.phase = GamePhase.Play1;

        this.addGameEvent(new GameSyncEvent(SyncEventType.TurnStart, { turn: this.turn, turnNum: this.turnNum }));
        return this.events;
    }

    // Server Query Logic ----------------------------------------------
    private onQueryResult: (cards: Card[]) => void;

    private setQueryResult(cards: Card[]) {
        if (this.onQueryResult)
            this.onQueryResult(cards);
    }

    public queryCards(getCards: (game: Game) => Card[], callback: (cards: Card[]) => void) {
        if (this.client) {
            this.onQueryResult = callback;
        } else {
            let cards = getCards(this);
            callback(cards);
            this.addGameEvent(new GameSyncEvent(SyncEventType.QueryResult, {
                cards: cards.map(card => card.getPrototype())
            }));
        }
    }

    // Card Play Logic ---------------------------------------------------
    public playCard(player: Player, card: Card) {
        player.playCard(this, card);
    }

    private generatedCardId = 1;
    public playGeneratedUnit(player: Player | number, card: Card) {
        if (typeof player == "number")
            player = this.getPlayer(player);
        card.setOwner(player.getPlayerNumber());
        card.setId(this.generatedCardId.toString(16));
        this.cardPool.set(card.getId(), card);
        this.generatedCardId++;
        player.playCard(this, card, true);
    }

    public playFromCrypt(card: Card) {
        let player = this.players[card.getOwner()];
        let crypt = this.crypt[card.getOwner()];
        if (crypt.indexOf(card) == -1)
            return;
        crypt.splice(crypt.indexOf(card), 1);
        player.playCard(this, card, true);
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

    public canTakeAction() {
        return this.waitingForPlayerChoice == null;
    }

    private addActionHandeler(type: GameActionType, cb: ActionCb) {
        this.actionHandelers.set(type, cb.bind(this));
    }

    private addActionHandelers() {
        this.addActionHandeler(GameActionType.Pass, this.passAction);
        this.addActionHandeler(GameActionType.PlayResource, this.playResourceAction);
        this.addActionHandeler(GameActionType.PlayCard, this.playCardAction);
        this.addActionHandeler(GameActionType.ToggleAttack, this.toggleAttackAction);
        this.addActionHandeler(GameActionType.DeclareBlocker, this.declareBlockerAction);
        this.addActionHandeler(GameActionType.CardChoice, this.cardChoiceAction);
        this.addActionHandeler(GameActionType.Quit, this.quit);
    }

    private cardChoiceAction(act: GameAction): boolean {
        if (act.player != this.waitingForPlayerChoice) {
            console.log('Reject choice', this.waitingForPlayerChoice, act.player);
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
    private playCardAction(act: GameAction): boolean {
        let player = this.players[act.player];
        if (!this.isPlayerTurn(act.player))
            return false;
        let card = this.getPlayerCardById(player, act.params.id);
        if (!card || !card.isPlayable(this))
            return false;
        let targets: Unit[] = act.params.targetIds.map((id: string) => this.getUnitById(id));
        card.getTargeter().setTargets(targets);
        if (!card.getTargeter().targetsAreValid(card, this))
            return false;
        this.playCard(player, card);
        this.addGameEvent(new GameSyncEvent(SyncEventType.PlayCard, {
            playerNo: act.player,
            played: card.getPrototype(),
            targetIds: act.params.targetIds
        }));
        return true;
    }

    /* Preconditions 
        - It is the first phase of the acitng players turn
        - Unit is on the battlfield, 
        - Unit can attack
    */
    private toggleAttackAction(act: GameAction): boolean {
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
    private declareBlockerAction(act: GameAction) {
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
    private playResourceAction(act: GameAction): boolean {
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

    private passAction(act: GameAction): boolean {
        if (!this.isActivePlayer(act.player)) {
            console.error('Cant pass, not active player player', this.getActivePlayer(), GamePhase[this.phase], this.turn);
            return false;
        }
        this.nextPhase();
        return true;
    }

    // Combat -------------------------------------------------------------
    public playerCanAttack(playerNo: number) {
        return this.phase == GamePhase.Play1 && this.isActivePlayer(playerNo) && this.canTakeAction();
    }

    public isAttacking() {
        return this.getAttackers().length > 0;
    }

    public getAttackers() {
        let units = this.board.getPlayerUnits(this.turn);
        return units.filter(unit => unit.isAttacking());
    }

    public getBlockers() {
        return this.board.getPlayerUnits(this.getNonturnPlayer())
            .filter(unit => unit.getBlockedUnitId());
    }

    private resolveCombat() {
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        if (this.log)
            this.log.addCombatResolved(attackers, blockers, defendingPlayer.getPlayerNumber());

        blockers.forEach(blocker => {
            let blocked = this.getPlayerUnitById(this.getCurrentPlayer().getPlayerNumber(), blocker.getBlockedUnitId());
            if (blocked)
                blocked.fight(blocker);
            blocker.setBlocking(null);
        });

        attackers.forEach(attacker => {
            if (!attacker.isExausted()) {
                attacker.dealAndApplyDamage(defendingPlayer, attacker.getDamage());
                attacker.setExausted(true);
            }
            attacker.toggleAttacking();
        });

        this.changePhase(GamePhase.Play2);
    }

    private blockersExist() {
        let potentialBlockers = this.board.getPlayerUnits(this.getNonturnPlayer());
        let attackers = this.board.getPlayerUnits(this.getCurrentPlayer().getPlayerNumber())
            .filter(unit => unit.isAttacking());

        for (let blocker of potentialBlockers) {
            for (let attacker of attackers) {
                if (blocker.canBlock(attacker)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Game Flow Logic (phases, turns) -------------------------------------------------
    private endPhaseOne() {
        if (this.isAttacking()) {
            if (this.blockersExist()) {
                this.changePhase(GamePhase.Block);
            } else {
                this.resolveCombat();
            }
        } else {
            this.startEndPhase();
        }
    }

    private changePhase(nextPhase: GamePhase) {
        this.phase = nextPhase;
        this.addGameEvent(new GameSyncEvent(SyncEventType.PhaseChange, { phase: nextPhase }));
    }

    private startEndPhase() {
        this.gameEvents.trigger(EventType.EndOfTurn, new Map());
        this.changePhase(GamePhase.End);
        this.getCurrentPlayer().discardExtra(this);
    }

    private nextPhase() {
        switch (this.phase) {
            case GamePhase.Play1:
                this.endPhaseOne();
                break;
            case GamePhase.Play2:
                this.startEndPhase();
                break;
            case GamePhase.Block:
                this.resolveCombat();
                break;
        }
    }

    public nextTurn() {
        this.turn = this.getOtherPlayerNumber(this.turn);
        this.turnNum++;
        this.addGameEvent(new GameSyncEvent(SyncEventType.TurnStart, { turn: this.turn, turnNum: this.turnNum }));
        this.refresh();
    }

    public refresh() {
        this.phase = GamePhase.Play1;
        let currentPlayerEntities = this.getCurrentPlayerUnits();
        currentPlayerEntities.forEach(unit => unit.refresh());
        this.players[this.turn].startTurn();
        this.gameEvents.trigger(EventType.StartOfTurn, new Map([
            ['player', this.turn]
        ]));
    }

    // Unit Zone Changes ------------------------------------------------------
    public playUnit(unit: Unit, owner: number) {
        if (this.board.canPlayUnit(unit))
            this.addUnit(unit, owner);
    }

    public changeUnitOwner(unit: Unit) {
        let originalOwner = unit.getOwner();
        let newOwner = this.getOtherPlayerNumber(originalOwner);

        this.removeUnit(unit);
        unit.setOwner(newOwner);
        unit.getTargeter().setTargets([]);
        unit.play(this);
    }

    public returnUnitToDeck(unit: Unit) {
        this.removeUnit(unit);
        this.players[unit.getOwner()].addToDeck(unit);
    }

    public returnUnitToHand(unit: Unit) {
        this.removeUnit(unit);
        this.players[unit.getOwner()].addToHand(unit);
    }

    private removeUnit(unit: Unit) {
        unit.leaveBoard(this);
        unit.getEvents().removeEvents(null);
        this.board.removeUnit(unit);
    }

    public addUnit(unit: Unit, owner: number) {
        unit.getEvents().addEvent(null, new GameEvent(EventType.Death, (params) => {
            this.removeUnit(unit);
            this.addToCrypt(unit);
            this.gameEvents.trigger(EventType.UnitDies, new Map([
                ['deadUnit', unit]
            ]));
            return params;
        }));
        unit.getEvents().addEvent(null, new GameEvent(EventType.Annihilate, (params) => {
            this.removeUnit(unit);
            return params;
        }));
        this.board.addUnit(unit);
        this.gameEvents.trigger(EventType.UnitEntersPlay, new Map<string, any>([
            ['enteringUnit', unit]
        ]));
        unit.checkDeath();
    }

    // Misc Getters and setters ---------------------------------------------------

    public getLog() {
        return this.log;
    }

    public getPlayer(playerNum: number) {
        return this.players[playerNum];
    }

    public getBoard() {
        return this.board;
    }

    public getCurrentPlayerUnits() {
        return this.board.getAllUnits().filter(unit => this.isPlayerTurn(unit.getOwner()));
    }

    public getNonturnPlayer() {
        return this.getOtherPlayerNumber(this.turn);
    }

    public getActivePlayer() {
        if (this.phase == GamePhase.Block) {
            return this.getOtherPlayerNumber(this.turn);
        } else {
            return this.turn;
        }
    }

    public getOtherPlayerNumber(playerNum: number): number {
        return (playerNum + 1) % this.players.length
    }

    public getCurrentPlayer() {
        return this.players[this.turn];
    }

    private getPlayerCardById(player: Player, id: string): Card | undefined {
        return player.getHand().find(card => card.getId() == id);
    }

    public getCardById(id: string): Card | undefined {
        return this.cardPool.get(id);
    }

    public getUnitById(id: string): Unit | undefined {
        return this.board.getAllUnits().find(unit => unit.getId() == id);
    }

    private getPlayerUnitById(playerNo: number, id: string): Unit | undefined {
        return this.board.getPlayerUnits(playerNo).find(unit => unit.getId() == id);
    }

    public getPhase() {
        return this.phase;
    }

    public getPlayerActions() {
        return this.events;
    }

    public isPlayerTurn(player: number) {
        return this.turn === player;
    }

    public isActivePlayer(player: number) {
        return this.phase == GamePhase.Block ?
            !this.isPlayerTurn(player) :
            this.isPlayerTurn(player);
    }

    public isPlayPhase() {
        return this.phase == GamePhase.Play1 || this.phase == GamePhase.Play2;
    }
}
