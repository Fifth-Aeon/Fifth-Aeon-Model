import { Board } from './board';
import { Player } from './player';
import { Card } from './card';
import { Unit } from './unit';
import { GameFormat } from './gameFormat';
import { Resource } from './resource';
import { GameEvent, EventType } from './gameEvent';
import { data } from './gameData';

import { Serialize, Deserialize } from 'cerialize';

export enum GamePhase {
    play1, combat, play2, end, responceWindow
}

const game_phase_count = 4;

export enum GameActionType {
    mulligan, playResource, playCard, pass, concede, activateAbility,
    toggleAttack, declareBlockers, distributeDamage,
    declareTarget, Quit
}

export enum GameEventType {
    start, attackToggled, turnStart, phaseChange, playResource, mulligan, playCard, block, draw
}

export interface GameAction {
    type: GameActionType,
    player: number,
    params: any
}

export class SyncGameEvent {
    constructor(public type: GameEventType, public params: any) { }
}

type actionCb = (act: GameAction) => boolean;
export class Game {
    // Id of the game on the server
    public id: string;
    // A board containing units in play
    private board: Board;
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
    private actionHandelers: Map<GameActionType, actionCb>
    // A list of all events that have taken place this game and need to be sent to clients
    private events: SyncGameEvent[];
    // A list of  units currently attacking
    private attackers: Unit[];
    // A list of blocks by the defending player
    private blockers: [Unit, Unit][];
    // A map of cards loaded from the server so far
    private cardPool: Map<string, Card>;

    /**
     * Constructs a game given a format. The format
     * informs how the game is initlized eg how
     * much health each player starts with.
     * 
     * @param {any} [format=new GameFormat()] 
     * @memberof Game
     */
    constructor(format = new GameFormat(), client: boolean = false) {
        this.format = format;
        this.board = new Board(this.format.playerCount, this.format.boardSize);
        this.cardPool = new Map<string, Card>();
        this.turnNum = 1;
        this.actionHandelers = new Map<GameActionType, actionCb>();
        this.players = [
            new Player(this, data.getRandomDeck(format.minDeckSize), 0, this.format.initalResource[0], this.format.initialLife[0]),
            new Player(this, data.getRandomDeck(format.minDeckSize), 1, this.format.initalResource[1], this.format.initialLife[1])
        ];
        this.events = [];
        this.attackers = [];
        this.blockers = [];

        if (client) {
            this.players.forEach(player => player.disableDraw());
        }

        this.addActionHandeler(GameActionType.pass, this.pass);
        this.addActionHandeler(GameActionType.playResource, this.playResource);
        this.addActionHandeler(GameActionType.playCard, this.playCardAction);
        this.addActionHandeler(GameActionType.toggleAttack, this.toggleAttack);
        this.addActionHandeler(GameActionType.declareBlockers, this.declareBlocker);
    }

    // Syncronization --------------------------------------------------------

    /**
     * Syncs an event that happened on the server into the state of this game model
     * 
     * @param {number} playerNumber 
     * @param {SyncGameEvent} event 
     * @memberof Game
     */
    public syncServerEvent(playerNumber: number, event: SyncGameEvent) {
        let params = event.params;
        console.log('sync', GameEventType[event.type], event.params);
        switch (event.type) {
            case GameEventType.playCard:
                if (params.playerNo != playerNumber) {
                    let player = this.players[params.playerNo];
                    let card = this.unpackCard(params.played, params.playerNo)
                    if (params.target.id)
                        card.getTargeter().setTarget(this.getUnitById(params.target.id));
                    this.playCard(player, card);
                }
                break;
            case GameEventType.draw:
                if (params.playerNo == playerNumber) {
                    this.players[params.playerNo].addToHand(this.unpackCard(params.card, params.playerNo))
                }
                break;
            case GameEventType.turnStart:
                this.turn = params.turn;
                this.turnNum = params.turnNum
                this.refresh();
                break;
            case GameEventType.playResource:
                this.players[params.playerNo].getPool().add(params.resource)
                break;
            case GameEventType.attackToggled:
                if (params.player != playerNumber)
                    this.getPlayerUnitById(params.player, params.unitId).toggleAttacking();
                break;
            case GameEventType.block:
                if (params.player != playerNumber)
                    this.getPlayerUnitById(params.player, params.blockerId).setBlocking(params.blockedId);
                break;
            case GameEventType.phaseChange:
                this.phase = params.phase;
                if (this.phase === GamePhase.play2)
                    this.resolveCombat();

        }
    }

    public unpackCard(proto: { id: string, data: string }, owner: number) {
        if (this.cardPool.has(proto.id))
            return this.cardPool.get(proto.id);
        let card = data.getCard(proto.data);
        card.setId(proto.id);
        card.setOwner(owner);
        this.cardPool.set(proto.id, card);
        return card;
    }

    /**
     * 
     * Handles a players action and returns a list of events that
     * resulted from that aciton.
     * 
     * @param {GameAction} action 
     * @returns {SyncGameEvent[]} 
     * @memberof Game
     */
    public handleAction(action: GameAction): SyncGameEvent[] {
        let mark = this.events.length;
        let handeler = this.actionHandelers.get(action.type);
        if (!handeler)
            return [];
        let sig = handeler(action);
        return this.events.slice(mark);
    }

    private addActionHandeler(type: GameActionType, cb: actionCb) {
        this.actionHandelers.set(type, cb.bind(this));
    }


    // Game Logic --------------------------------------------------------
    public startGame() {
        this.turn = 0;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].drawCards(this.format.initialDraw[i]);
        }
        this.players[this.turn].startTurn();
        this.getCurrentPlayerUnits().forEach(unit => unit.refresh());
        this.phase = GamePhase.play1;

        this.addGameEvent(new SyncGameEvent(GameEventType.turnStart, { turn: this.turn, turnNum: this.turnNum }));
        return this.events;
    }

    public getCurrentPlayer() {
        return this.players[this.turn];
    }

    private getCardById(player: Player, id: string): Card | undefined {
        return player.getHand().find(card => card.getId() == id);
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

    private playCardAction(act: GameAction): boolean {
        let player = this.players[act.player];
        if (!this.isPlayerTurn(act.player))
            return false;
        let card = this.getCardById(player, act.params.id);
        if (!card)
            return false;
        if (act.params.target.id != null)
            card.getTargeter().setTarget(this.getUnitById(act.params.target.id));
        this.playCard(player, card);
        this.addGameEvent(new SyncGameEvent(GameEventType.playCard, {
            playerNo: act.player,
            played: card.getPrototype(),
            target: act.params.target
        }));
        return true;
    }

    public playCard(player: Player, card: Card) {
        player.playCard(this, card);
    }

    public playerCanAttack(playerNo: number) {
        return this.phase == GamePhase.play1 && this.isActivePlayer(playerNo);
    }

    public isAttacking() {
        return this.getAttackers().length > 0;
    }

    public getAttackers() {
        let units = this.board.getPlayerUnits(this.turn);
        return units.filter(unit => unit.isAttacking());
    }

    private toggleAttack(act: GameAction): boolean {
        let player = this.players[act.player];
        let unit = this.getPlayerUnitById(act.player, act.params.unitId);
        if (!unit.canAttack())
            return false;
        unit.toggleAttacking();
        this.addGameEvent(new SyncGameEvent(GameEventType.attackToggled, { player: act.player, unitId: act.params.unitId }));
        return true;
    }


    private declareBlocker(act: GameAction) {
        let player = this.players[act.player];
        let blocker = this.getUnitById(act.params.blockerId);
        let blocked = this.getUnitById(act.params.blockedId);
        if (this.isPlayerTurn(act.player) || this.phase !== GamePhase.combat || !blocker.canBlock(blocked))
            return false;
        blocker.setBlocking(blocked.getId());
        this.addGameEvent(new SyncGameEvent(GameEventType.block, {
            player: act.player,
            blockerId: act.params.blockerId,
            blockedId: act.params.blockedId
        }));

        return true;
    }

    private playResource(act: GameAction): boolean {
        let player = this.players[act.player];
        if (!(this.isPlayerTurn(act.player) && player.canPlayResource()))
            return false;
        let res = this.format.basicResources.get(act.params.type);
        if (!res)
            return false;
        player.playResource(res);
        this.addGameEvent(new SyncGameEvent(GameEventType.playResource, { playerNo: act.player, resource: res }));
        return true;
    }

    private pass(act: GameAction): boolean {
        if (!this.isActivePlayer(act.player))
            return false;
        this.nextPhase(act.player);
        return true;
    } 

    public getBlockers() {
        return this.board.getPlayerUnits(this.getInactivePlayer())
            .filter(unit => unit.getBlockedUnitId());
    }

    private resolveCombat() {
        console.log('resolve combat');
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        blockers.forEach(blocker => {
            let blocked = this.getPlayerUnitById(this.getCurrentPlayer().getPlayerNumber(), blocker.getBlockedUnitId());
            blocked.fight(blocker);
        })

        attackers.forEach(attacker => {
            if (!attacker.isExausted()) {
                attacker.dealDamage(defendingPlayer, attacker.getDamage());
                attacker.setExausted(true);
            }
            attacker.toggleAttacking();
        });
    }

    private blockersExist() {
        let potentialBlockers = this.board.getPlayerUnits(this.getInactivePlayer());
        let attackers = this.board.getPlayerUnits(this.getCurrentPlayer().getPlayerNumber());

        for (let blocker of potentialBlockers) {
            for (let attacker of attackers) {
                if (blocker.canBlock(attacker))
                    return true;
            }
        }
        return false;
    }

    private endPhaseOne() {
        if (this.isAttacking()) {
            if (this.blockersExist()) {
                this.phase = GamePhase.combat;
                this.addGameEvent(new SyncGameEvent(GameEventType.phaseChange, { phase: this.phase }));
            } else {
                this.resolveCombat();
                this.phase = GamePhase.play2;
                this.addGameEvent(new SyncGameEvent(GameEventType.phaseChange, { phase: this.phase }));
            }
        } else {
            this.nextTurn();
        }
    }

    private nextPhase(player: number) {
        console.log('nextPhase', this.phase);
        switch (this.phase) {
            case GamePhase.play1:
                this.endPhaseOne();
                break;
            case GamePhase.play2:
                this.nextTurn();
                break;
            case GamePhase.combat:
                this.resolveCombat();
                this.phase = GamePhase.play2;
                this.addGameEvent(new SyncGameEvent(GameEventType.phaseChange, { phase: this.phase }));
                break;
        }
    }

    public addGameEvent(event: SyncGameEvent) {
        this.events.push(event);
    }

    public isPlayerTurn(player: number) {
        return this.turn === player;
    }

    public isActivePlayer(player: number) {
        return this.phase != GamePhase.combat && this.isPlayerTurn(player) ||
            this.phase == GamePhase.combat && !this.isPlayerTurn(player);
    }

    public removeUnit(unit: Unit) {
        this.board.removeUnit(unit);
    }

    public playUnit(ent: Unit, owner: number) {
        this.addUnit(ent, owner);
    }

    public addUnit(unit: Unit, owner: number) {
        unit.getEvents().addEvent(null, new GameEvent(EventType.onDeath, (params) => {
            this.removeUnit(unit);
            return params;
        }));
        this.board.addUnit(unit);
    }

    public nextTurn() {
        this.turn = this.getOtherPlayerNumber(this.turn);
        this.turnNum++;
        this.addGameEvent(new SyncGameEvent(GameEventType.turnStart, { turn: this.turn, turnNum: this.turnNum }));
        this.refresh();
    }

    public refresh() {
        this.phase = GamePhase.play1;
        let currentPlayerEntities = this.getCurrentPlayerUnits();
        currentPlayerEntities.forEach(unit => unit.refresh());
        this.players[this.turn].startTurn();
    }

    // Getters and setters ---------------------------------------------------

    public getPlayer(playerNum: number) {
        return this.players[playerNum];
    }

    public getBoard() {
        return this.board;
    }

    public getCurrentPlayerUnits() {
        return this.board.getAllUnits().filter(unit => this.isPlayerTurn(unit.getOwner()));
    }

    public getInactivePlayer() {
        return this.getOtherPlayerNumber(this.turn);
    }

    public getOtherPlayerNumber(playerNum: number): number {
        return (playerNum + 1) % this.players.length
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
        // TODO, check for winner
        return -1;
    }
}
