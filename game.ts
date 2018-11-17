import { ChoiceHeuristic } from './ai/defaultAi';
import { knapsack } from './algorithms';
import { Board } from './board';
import { Card, CardType, GameZone } from './card';
import { Enchantment } from './enchantment';
import { GameEventSystem } from './events/eventSystems';
import { GameFormat, standardFormat } from './gameFormat';
import { Log } from './log';
import { EvalContext } from './mechanic';
import { Permanent } from './permanent';
import { Player } from './player';
import { Unit } from './unit';



export enum GamePhase {
    Play1, Block, DamageDistribution, Play2, End, Response
}

export enum GameActionType {
    Mulligan, PlayResource, PlayCard, Pass, Concede, ActivateAbility, ModifyEnchantment,
    ToggleAttack, DeclareBlocker, DistributeDamage, CardChoice, Quit
}

export enum SyncEventType {
    Start, AttackToggled, TurnStart, PhaseChange, PlayResource, Mulligan,
    PlayCard, Block, Draw, ChoiceMade, QueryResult, Ended, EnchantmentModified,
    DamageDistributed
}

export interface GameAction {
    type: GameActionType;
    player: number;
    params: any;
}

interface Choice {
    player: number;
    validCards: Set<Card>;
    min: number;
    max: number;
    callback: (cards: Card[]) => void;
}

export class GameSyncEvent {
    constructor(public type: SyncEventType, public params: any) { }
}

export abstract class Game {
    // Id of the game on the server
    public id: string;
    // A board containing units in play
    protected board: Board;
    // Where dead cards go
    protected crypt: [Card[], Card[]];
    // The number of player whose turn it currently is
    protected turn: number;
    // The number of turns that have passed from the games start
    protected turnNum: number;
    // The players playing the game
    protected players: Player[];
    // The format of the game
    protected format: GameFormat;
    // The phase of the current players turn (eg main phase, attack phase)
    protected phase: GamePhase;
    // The previous phase (used to return from response phases)
    protected lastPhase: GamePhase;
    // A list of all events that have taken place this game and need to be sent to clients
    protected events: GameSyncEvent[];
    // A list of  units currently attacking
    protected attackers: Unit[];
    // A list of blocks by the defending player
    protected blockers: [Unit, Unit][];
    // A map of the order to apply damage in combat
    protected attackDamageOrder: Map<string, Unit[]> = null;
    // A list attack orders that can be rearranged
    protected orderableAttacks: Map<string, Unit[]> = null;
    // A map of cards loaded from the server so far
    protected cardPool: Map<string, Card>;
    // A group of game logic events that are not connected to any individual unit
    public gameEvents: GameEventSystem;
    // Flag to tell us which player's choice we are waiting for (null if not waiting)
    protected currentChoices: Choice[] = [null, null];
    protected log: Log;
    protected winner = -1;
    protected generatedCardId = 1;
    public promptCardChoice: (
        player: number,
        choices: Card[],
        min: number,
        max: number,
        callback: (cards: Card[]) => void,
        message: string,
        evaluator: ChoiceHeuristic
    ) => void;
    protected onQueryResult: (cards: Card[]) => void;
    protected client = false;


    /**
     * Constructs a game given a format. The format
     * informs how the game is initialized eg how
     * much health each player starts with.
     *
     * @param {string} name
     * @param {GameFormat} [format=standardFormat]
     * @memberof Game
     */
    constructor(protected name: string, format = standardFormat) {
        this.format = format;
        this.board = new Board(this.format.playerCount, this.format.boardSize);
        this.cardPool = new Map<string, Card>();
        this.turnNum = 1;
        this.events = [];
        this.attackers = [];
        this.blockers = [];
        this.crypt = [[], []];
        this.gameEvents = new GameEventSystem();
        this.promptCardChoice = this.deferChoice;
    }

    protected addDeathHandlers() {
        this.players.forEach((player, number) => {
            player.getEvents().death.addEvent(null, (params) => {
                this.endGame(this.getOtherPlayerNumber(number));
                return params;
            });
        });
    }

    public getName() {
        return this.name;
    }

    public addGameEvent(event: GameSyncEvent) {
        this.events.push(event);
    }

    public mulligan() {
        for (let player of this.players) {
            player.replace(this, 0, player.getHand().length);
        }
    }

    // Game End Logic -----------------------------------------------
    protected endGame(winningPlayer: number, quit: boolean = false) {
        if (this.winner !== -1)
            return;
        this.winner = winningPlayer;
        this.addGameEvent(new GameSyncEvent(SyncEventType.Ended, { winner: winningPlayer, quit: quit }));
    }

    protected quit(action: GameAction) {
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

    // Player choice =--------------------------------------------------------
    public deferChoice(player: number, choices: Card[], min: number, max: number, callback: (cards: Card[]) => void) {
        if (!callback)
            return;
        this.currentChoices[player] = {
            player: player,
            validCards: new Set(choices),
            min: min,
            max: max,
            callback: callback
        };
    }

    protected makeDeferredChoice(player: number, cards: Card[]) {
        if (this.currentChoices[player] !== null) {
            this.currentChoices[player].callback(cards);
        } else {
            console.error(`Error in game ${this.name} no deferred choice handler for ${
                cards.map(card => card.getName())} from ${player}`);
        }
        this.currentChoices[player] = null;
    }

    // Crypt logic ----------------------------------------------------
    public addToCrypt(card: Card) {
        card.setLocation(GameZone.Crypt);
        this.crypt[card.getOwner()].push(card);
    }

    public getCrypt(player: number) {
        return this.crypt[player];
    }


    // Server Query Logic ----------------------------------------------

    protected setQueryResult(cards: Card[]) {
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

    public playGeneratedUnit(player: Player | number, card: Card) {
        if (typeof player === 'number')
            player = this.getPlayer(player);
        card.setOwner(player.getPlayerNumber());
        card.setId(this.generatedCardId.toString(10));
        this.cardPool.set(card.getId(), card);
        this.generatedCardId++;
        player.playCard(this, card, true);
        return card as Unit;
    }

    public playFromCrypt(card: Card) {
        let player = this.players[card.getOwner()];
        let crypt = this.crypt[card.getOwner()];
        if (crypt.indexOf(card) === -1)
            return;
        crypt.splice(crypt.indexOf(card), 1);
        player.playCard(this, card, true);
    }

    public canTakeAction() {
        return this.currentChoices[0] === null && this.currentChoices[1] === null;
    }

    // Combat -------------------------------------------------------------
    public playerCanAttack(playerNo: number) {
        return this.phase === GamePhase.Play1 && this.isActivePlayer(playerNo) && this.canTakeAction();
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

    private getBasicDamageDistribution(attacker: Unit, blockers: Unit[]) {
        let damage = attacker.getDamage();
        let toKill = new Set(knapsack(damage, blockers.map(blocker => {
            return {
                w: blocker.getLife(),
                b: blocker.evaluate(this, EvalContext.LethalRemoval),
                data: blocker
            };
        })).set.map(sack => sack.data));
        let notToKill = blockers.filter(blocker => !toKill.has(blocker));
        return Array.from(toKill.values()).concat(notToKill);
    }

    protected generateDamageDistribution() {
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        this.attackDamageOrder = new Map<string, Unit[]>();

        // Create a list of blockers for each attacker
        for (let blocker of blockers) {
            let blocked = this.getPlayerUnitById(this.getCurrentPlayer().getPlayerNumber(), blocker.getBlockedUnitId());
            const id = blocked.getId();
            if (this.attackDamageOrder.has(id)) {
                this.attackDamageOrder.get(id).push(blocker);
            } else {
                this.attackDamageOrder.set(id, [blocker]);
            }
        }

        // Set damage order according to basic A.I
        for (let attackerID of Array.from(this.attackDamageOrder.keys())) {
            this.attackDamageOrder.set(attackerID,
                this.getBasicDamageDistribution(this.getUnitById(attackerID), this.attackDamageOrder.get(attackerID)));
        }

        return this.attackDamageOrder;
    }



    public getModableDamageDistributions() {
        let orderableAttacks = new Map<string, Unit[]>();
        for (let attackerID of Array.from(this.attackDamageOrder.keys())) {
            let defenders = this.attackDamageOrder.get(attackerID);
            let dmg = this.getUnitById(attackerID).getDamage();
            if (defenders.length > 1 && defenders
                .map(unit => unit.getLife())
                .reduce((a, b) => a + b) > dmg)
                orderableAttacks.set(attackerID, defenders);
        }
        this.orderableAttacks = orderableAttacks;
        return this.orderableAttacks;
    }

    protected resolveCombat() {
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        if (this.attackDamageOrder === null) {
            this.generateDamageDistribution();
        }

        // Apply blocks in order decided by attacker
        for (let attackerID of Array.from(this.attackDamageOrder.keys())) {
            let attacker = this.getUnitById(attackerID);
            let damageOrder = this.attackDamageOrder.get(attackerID);
            let remainingDamage = attacker.getDamage();

            for (let blocker of damageOrder) {
                let assignedDamage = Math.min(blocker.getLife(), remainingDamage);
                remainingDamage -= assignedDamage;
                blocker.getEvents().block.trigger( { attacker});
                blocker.getEvents().attack.trigger({ attacker: attacker, damage: assignedDamage, defender: blocker});
                attacker.fight(blocker, assignedDamage);
                blocker.setBlocking(null);
            }
        }

        // Unblocked attackers damage the defending player
        for (let attacker of attackers) {
            if (!this.attackDamageOrder.has(attacker.getId())) {
                attacker.dealAndApplyDamage(defendingPlayer, attacker.getDamage());
                attacker.setExhausted(true);
            }
            attacker.toggleAttacking();
        }

        this.attackDamageOrder = null;
        this.changePhase(GamePhase.Play2);
    }

    protected blockersExist() {
        let potentialBlockers = this.board.getPlayerUnits(this.getNonturnPlayer());
        let attackers = this.board.getPlayerUnits(this.getCurrentPlayer().getPlayerNumber())
            .filter(unit => unit.isAttacking());

        for (let blocker of potentialBlockers) {
            for (let attacker of attackers) {
                if (blocker.canBlockTarget(attacker)) {
                    return true;
                }
            }
        }
        return false;
    }

    public addCardToPool(card: Card) {
        this.cardPool.set(card.getId(), card);
    }

    // Game Flow Logic (phases, turns) -------------------------------------------------

    protected changePhase(nextPhase: GamePhase) {
        this.phase = nextPhase;
        this.addGameEvent(new GameSyncEvent(SyncEventType.PhaseChange, { phase: nextPhase }));
    }

    protected startEndPhase() {
        this.gameEvents.endOfTurn.trigger({ player: this.turn });
        this.changePhase(GamePhase.End);
        this.getCurrentPlayer().discardExtra(this);
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
        this.gameEvents.startOfTurn.trigger({ player: this.turn });
    }

    // Unit Zone Changes ------------------------------------------------------
    public playPermanent(permanent: Permanent, owner: number) {
        if (!this.board.canPlayPermanent(permanent))
            return;
        switch (permanent.getCardType()) {
            case CardType.Unit:
                this.addUnit(permanent as Unit, owner);
                break;
            case CardType.Enchantment:
                this.addEnchantment(permanent as Enchantment, owner);
                break;
        }
    }

    public changeUnitOwner(unit: Unit) {
        let originalOwner = unit.getOwner();
        let newOwner = this.getOtherPlayerNumber(originalOwner);

        this.removePermanent(unit);
        unit.setOwner(newOwner);
        unit.getTargeter().setTargets([]);
        this.addUnit(unit, newOwner, false);
    }

    public returnPermanentToDeck(perm: Permanent) {
        this.removePermanent(perm);
        this.players[perm.getOwner()].addToDeck(perm);
    }

    public returnPermanentToHand(perm: Permanent) {
        this.removePermanent(perm);
        this.players[perm.getOwner()].addToHand(perm);
    }

    protected removePermanent(perm: Permanent) {
        perm.leaveBoard(this);
        perm.getEvents().removeEvents(null);
        this.board.removePermanent(perm);
    }

    public addEnchantment(enchantment: Enchantment, owner: number) {
        enchantment.getEvents().death.addEvent(null,  (params) => {
            this.removePermanent(enchantment);
            this.addToCrypt(enchantment);
            return params;
        }, Infinity);
        this.board.addPermanent(enchantment);
    }

    public addUnit(unit: Unit, owner: number, etb: boolean = true) {
        unit.getEvents().death.addEvent(null,  (params) => {
            this.removePermanent(unit);
            this.addToCrypt(unit);
            unit.detachItems(this);
            this.gameEvents.unitDies.trigger({ deadUnit: unit });
            return params;
        }, Infinity);
        unit.getEvents().annihilate.addEvent(null,  (params) => {
            this.removePermanent(unit);
            return params;
        });
        this.board.addPermanent(unit);

        this.gameEvents.unitEntersPlay.trigger({ enteringUnit: unit });
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

    public getEvents() {
        return this.gameEvents;
    }

    public getCurrentPlayerUnits() {
        return this.board.getAllUnits().filter(unit => this.isPlayerTurn(unit.getOwner()));
    }

    public getNonturnPlayer() {
        return this.getOtherPlayerNumber(this.turn);
    }

    public getActivePlayer() {
        if (this.phase === GamePhase.Block) {
            return this.getOtherPlayerNumber(this.turn);
        } else {
            return this.turn;
        }
    }



    public getOtherPlayerNumber(playerNum: number): number {
        return (playerNum + 1) % this.players.length;
    }

    public getCurrentPlayer() {
        return this.players[this.turn];
    }

    protected getPlayerCardById(player: Player, id: string): Card | undefined {
        return player.getHand().find(card => card.getId() === id);
    }

    public getCardById(id: string): Card | undefined {
        if (!this.cardPool.has(id))
            console.error(`No Card with id "${id}" in pool`, this.cardPool);
        return this.cardPool.get(id);
    }

    public getUnitById(id: string): Unit | undefined {
        return this.board.getAllUnits().find(unit => unit.getId() === id);
    }

    protected getPlayerUnitById(playerNo: number, id: string): Unit | undefined {
        return this.board.getPlayerUnits(playerNo).find(unit => unit.getId() === id);
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
        return this.phase === GamePhase.Block ?
            !this.isPlayerTurn(player) :
            this.isPlayerTurn(player);
    }

    public isPlayPhase() {
        return this.phase === GamePhase.Play1 || this.phase === GamePhase.Play2;
    }
}
