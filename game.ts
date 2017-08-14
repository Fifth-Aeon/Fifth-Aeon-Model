import { Board } from './board';
import { Player } from './player';
import { Card, Location } from './card';
import { Unit } from './unit';
import { GameFormat } from './gameFormat';
import { DeckList } from './deckList';
import { Resource } from './resource';
import { GameEvent, EventType, EventGroup } from './gameEvent';
import { data } from './gameData';

import { shuffle } from 'lodash';
import { Serialize, Deserialize } from 'cerialize';

export enum GamePhase {
    play1, combat, play2, end, responceWindow
}

const game_phase_count = 4;

export enum GameActionType {
    mulligan, playResource, playCard, pass, concede, activateAbility,
    toggleAttack, declareBlockers, distributeDamage, CardChoice,
    declareTarget, Quit
}

export enum GameEventType {
    start, attackToggled, turnStart, phaseChange, playResource, mulligan,
    playCard, block, draw, ChoiceMade, QueryResult, Ended
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
    // Where dead cards go
    private crypt: [Card[], Card[]]
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

    public gameEvents: EventGroup;


    private deferedChoice: (cards: Card[]) => void;
    private waitingForPlayerChoice: number | null = null;

    /**
     * Constructs a game given a format. The format
     * informs how the game is initlized eg how
     * much health each player starts with.
     * 
     * @param {any} [format=new GameFormat()] 
     * @memberof Game
     */
    constructor(format = new GameFormat(), private client: boolean = false, deckLists?: [DeckList, DeckList]) {
        this.format = format;
        this.board = new Board(this.format.playerCount, this.format.boardSize);
        this.cardPool = new Map<string, Card>();
        this.turnNum = 1;
        this.actionHandelers = new Map<GameActionType, actionCb>();

        this.events = [];
        this.attackers = [];
        this.blockers = [];
        this.crypt = [[], []];

        this.gameEvents = new EventGroup();

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

        this.addActionHandeler(GameActionType.pass, this.pass);
        this.addActionHandeler(GameActionType.playResource, this.playResource);
        this.addActionHandeler(GameActionType.playCard, this.playCardAction);
        this.addActionHandeler(GameActionType.toggleAttack, this.toggleAttack);
        this.addActionHandeler(GameActionType.declareBlockers, this.declareBlocker);
        this.addActionHandeler(GameActionType.CardChoice, this.makeCardChocie);
        this.addActionHandeler(GameActionType.Quit, this.quit);
    }

    private winner = -1;
    private endGame(winningPlayer: number, quit: boolean = false) {
        if (this.winner != -1)
            return;
        this.winner = winningPlayer;
        this.addGameEvent(new SyncGameEvent(GameEventType.Ended, { winner: winningPlayer, quit: quit }));
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
        this.events.push(event);
        switch (event.type) {
            case GameEventType.playCard:
                if (params.playerNo != playerNumber) {
                    let player = this.players[params.playerNo];
                    let card = this.unpackCard(params.played)
                    if (params.targetIds)
                        card.getTargeter().setTarget(params.targetIds
                            .map((id: string) => this.getUnitById(id)));
                    this.playCard(player, card);
                }
                break;
            case GameEventType.draw:
                // Todo, information hiding 
                this.players[params.playerNo].addToHand(this.unpackCard(params.card))
                break;
            case GameEventType.turnStart:
                this.gameEvents.trigger(EventType.EndOfTurn, new Map());
                this.turn = params.turn;
                this.turnNum = params.turnNum
                this.refresh();
                break;
            case GameEventType.playResource:
                this.players[params.playerNo].playResource(params.resource);
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
                break;
            case GameEventType.ChoiceMade:
                if (params.player != playerNumber && this.deferedChoice)
                    this.makeDeferedChoice(params.choice);
                break;
            case GameEventType.QueryResult:
                let cards = params.cards.map((proto: { id: string, data: string, owner: number }) => this.unpackCard(proto));
                this.setQueryResult(cards);
                break;
            case GameEventType.Ended:
                this.winner = event.params.winner;
                break;

        }
    }

    // Player choice =--------------------------------------------------------
    private deferChoice(player: number, choices: Card[], count: number, callback: (cards: Card[]) => void) {
        this.deferedChoice = callback;
        this.waitingForPlayerChoice = player;
    }

    public promptCardChoice: (player: number, choices: Card[], count: number, callback: (cards: Card[]) => void) => void;

    public setDeferedChoice(callback: (cards: Card[]) => void) {
        this.deferedChoice = callback;
    }
    private makeDeferedChoice(choiceIds: string[]) {
        this.deferedChoice(choiceIds.map((id: string) => this.getCardById(id)));
    }

    private makeCardChocie(act: GameAction): boolean {
        if (act.player != this.waitingForPlayerChoice)
            return false;
        this.makeDeferedChoice(act.params.choice);
        this.addGameEvent(new SyncGameEvent(GameEventType.ChoiceMade, {
            player: act.player,
            choice: act.params.choice
        }));
        return true;
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

    public addToCrypt(card: Card) {
        card.setLocation(Location.Crypt);
        this.crypt[card.getOwner()].push(card);
    }

    public getCrypt(player: number) {
        return this.crypt[player];
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

    private playCardAction(act: GameAction): boolean {
        let player = this.players[act.player];
        if (!this.isPlayerTurn(act.player))
            return false;
        let card = this.getPlayerCardById(player, act.params.id);
        if (!card)
            return false;
        if (act.params.targetIds != null) {
            card.getTargeter().setTarget(act.params.targetIds
                .map((id: string) => this.getUnitById(id)));
        }
        this.playCard(player, card);
        this.addGameEvent(new SyncGameEvent(GameEventType.playCard, {
            playerNo: act.player,
            played: card.getPrototype(),
            targetIds: act.params.targetIds
        }));
        return true;
    }

    private setQueryResult(cards: Card[]) {
        if (this.onQueryResult)
            this.onQueryResult(cards)
        else
            console.error('Query result', cards, 'with no query handler');
    }
    private onQueryResult: (cards: Card[]) => void;
    public queryCards(getCards: (game: Game) => Card[], callback: (cards: Card[]) => void) {
        if (this.client) {
            this.onQueryResult = callback;
        } else {
            let cards = getCards(this);
            callback(cards);
            this.addGameEvent(new SyncGameEvent(GameEventType.QueryResult, {
                cards: cards.map(card => card.getPrototype())
            }));
        }
    }

    public playCard(player: Player, card: Card) {
        player.playCard(this, card);
    }

    private generatedCardId = 1;
    public playGeneratedUnit(player: Player, card: Card) {
        card.setOwner(player.getPlayerNumber());
        card.setId(this.generatedCardId.toString(16));
        this.generatedCardId++;
        player.playCard(this, card, true);
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
        if (this.isPlayerTurn(act.player) || this.phase !== GamePhase.combat || 
            !blocker || !blocker ||!blocker.canBlock(blocked))
            return false;
        blocker.setBlocking(blocked ? blocked.getId() : null);
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
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        blockers.forEach(blocker => {
            let blocked = this.getPlayerUnitById(this.getCurrentPlayer().getPlayerNumber(), blocker.getBlockedUnitId());
            if (blocked)
                blocked.fight(blocker);
            blocker.setBlocking(null);
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

    public nextTurn() {
        this.gameEvents.trigger(EventType.EndOfTurn, new Map());
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
        this.gameEvents.trigger(EventType.StartOfTurn, new Map([
            ['player', this.turn]
        ]))
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


    // Unit Zone Changes ------------------------------------------------------
    public playUnit(unit: Unit, owner: number) {
        if (this.board.canPlayUnit(unit))
            this.addUnit(unit, owner);
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


}
