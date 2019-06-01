import { ChoiceHeuristic } from './ai/heuristics';
import { knapsack } from './algorithms';
import { Board } from './board';
import { Card, CardType, GameZone } from './card-types/card';
import { Enchantment } from './card-types/enchantment';
import { GameEventSystem } from './events/eventSystems';
import { QuitAction } from './events/gameAction';
import { GameSyncEvent, SyncEventType } from './events/syncEvent';
import { GameFormat, standardFormat } from './gameFormat';
import { Log } from './log';
import { EvalContext } from './mechanic';
import { Permanent } from './card-types/permanent';
import { Player } from './player';
import { ServerGame } from './serverGame';
import { Unit } from './card-types/unit';

export enum GamePhase {
    Play1,
    Block,
    DamageDistribution,
    Play2,
    End,
    Response
}

export interface Choice {
    player: number;
    validCards: Set<Card>;
    min: number;
    max: number;
    callback: (cards: Card[]) => void;
}

export abstract class Game {
    // Id of the game on the server
    public id = '';
    // A board containing units in play
    protected board: Board;
    // Where dead cards go
    protected crypt: [Card[], Card[]];
    // The number of player whose turn it currently is
    protected turn = 0;
    // The number of turns that have passed from the games start
    protected turnNum: number;
    // The players playing the game
    protected players: Player[] = [];
    // The format of the game
    protected format: GameFormat;
    // The phase of the current players turn (eg main phase, attack phase)
    protected phase: GamePhase = GamePhase.Play1;
    // The previous phase (used to return from response phases)
    protected lastPhase: GamePhase = GamePhase.Play1;
    // A list of all events that have taken place this game and need to be sent to clients
    protected events: GameSyncEvent[];
    // A list of  units currently attacking
    protected attackers: Unit[];
    // A list of blocks by the defending player
    protected blockers: [Unit, Unit][];
    // A map of the order to apply damage in combat
    protected attackDamageOrder: Map<string, Unit[]> | null = null;
    // A list attack orders that can be rearranged
    protected orderableAttacks: Map<string, Unit[]> | null = null;
    // A map of cards loaded from the server so far
    protected cardPool: Map<string, Card>;
    // A group of game logic events that are not connected to any individual unit
    public gameEvents: GameEventSystem;
    // Flag to tell us which player's choice we are waiting for (null if not waiting)
    protected currentChoices: (Choice | null)[] = [null, null];
    protected log: Log | undefined;
    protected winner = -1;
    protected generatedCardId = 1;
    protected lastPlayedCardName = 'None';
    public lastCardsPlayed: string[] = [];
    public promptCardChoice: (
        player: number,
        choices: Card[],
        min: number,
        max: number,
        callback: ((cards: Card[]) => void) | null,
        message: string,
        evaluator: ChoiceHeuristic
    ) => void;
    protected client = false;
    protected receivedChoice?: {
        player: number;
        cards: Array<Card>;
    };

    /**
     * Constructs a game given a format. The format
     * informs how the game is initialized eg how
     * much health each player starts with.
     *
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
            player.getEvents().death.addEvent(undefined, params => {
                this.endGame(this.getOtherPlayerNumber(number));
                return params;
            });
        });
    }

    public getName() {
        return this.name;
    }

    public addGameEvent(event: GameSyncEvent) {
        event.number = this.events.length;
        this.events.push(event);
    }

    public mulligan() {
        for (const player of this.players) {
            player.replace(this, 0, player.getHand().length);
        }
    }

    // Game End Logic -----------------------------------------------
    protected endGame(winningPlayer: number, quit: boolean = false) {
        if (this.winner !== -1) {
            return;
        }
        this.winner = winningPlayer;
        this.addGameEvent({
            type: SyncEventType.Ended,
            winner: winningPlayer,
            quit: quit
        });
    }

    protected quit(action: QuitAction) {
        this.endGame(this.getOtherPlayerNumber(action.player), true);
        return true;
    }

    /**
     *
     * Returns the number of the player who has won the game.
     * If it is still in progress it will return -1;
     *
     */
    public getWinner() {
        return this.winner;
    }

    // Player choice =--------------------------------------------------------
    public deferChoice(
        player: number,
        choices: Card[],
        min: number,
        max: number,
        callback: ((cards: Card[]) => void) | null
    ) {
        if (!callback) {
            return;
        }
        if (this.receivedChoice && this.receivedChoice.player === player) {
            callback(this.receivedChoice.cards);
            this.receivedChoice = undefined;
            return;
        }
        this.currentChoices[player] = {
            player: player,
            validCards: new Set(choices),
            min: min,
            max: max,
            callback: callback
        };
    }

    protected makeDeferredChoice(player: number, cards: Card[]) {
        const currentChoice = this.currentChoices[player];
        if (currentChoice !== null) {
            currentChoice.callback(cards);
        } else {
            this.receivedChoice = {
                player: player,
                cards: cards
            };
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

    public abstract queryCards(
        getCards: (game: ServerGame) => Card[],
        callback: (cards: Card[]) => void
    ): void;

    // Card Play Logic ---------------------------------------------------
    public playCard(player: Player, card: Card) {
        this.lastPlayedCardName = card.getName();
        this.lastCardsPlayed.push(card.getName());
        player.playCard(this, card);
    }

    public playGeneratedUnit(player: Player | number, card: Card) {
        if (typeof player === 'number') {
            player = this.getPlayer(player);
        }
        card.setOwner(player.getPlayerNumber());
        card.setId(this.generatedCardId.toString(10));
        this.cardPool.set(card.getId(), card);
        this.generatedCardId++;
        player.playCard(this, card, true);
        return card as Unit;
    }

    public playFromCrypt(card: Card) {
        const player = this.players[card.getOwner()];
        const crypt = this.crypt[card.getOwner()];
        if (crypt.indexOf(card) === -1) {
            return;
        }
        crypt.splice(crypt.indexOf(card), 1);
        player.playCard(this, card, true);
    }

    public canTakeAction() {
        return (
            this.currentChoices[0] === null && this.currentChoices[1] === null
        );
    }

    // Combat -------------------------------------------------------------
    public playerCanAttack(playerNo: number) {
        return (
            this.phase === GamePhase.Play1 &&
            this.isActivePlayer(playerNo) &&
            this.canTakeAction()
        );
    }

    public isAttacking() {
        return this.getAttackers().length > 0;
    }

    public getAttackers() {
        const units = this.board.getPlayerUnits(this.turn);
        return units.filter(unit => unit.isAttacking());
    }

    public getBlockers() {
        return this.board
            .getPlayerUnits(this.getNonturnPlayer())
            .filter(unit => unit.getBlockedUnitId());
    }

    private getBasicDamageDistribution(attacker: Unit, blockers: Unit[]) {
        const damage = attacker.getDamage();
        const toKill = new Set(
            knapsack(
                damage,
                blockers.map(blocker => {
                    return {
                        w: blocker.getLife(),
                        b: blocker.evaluate(
                            this,
                            EvalContext.LethalRemoval,
                            new Map()
                        ),
                        data: blocker
                    };
                })
            ).set.map(sack => sack.data)
        );
        const notToKill = blockers.filter(blocker => !toKill.has(blocker));
        return Array.from(toKill.values()).concat(notToKill);
    }

    protected generateDamageDistribution() {
        const blockers = this.getBlockers();
        this.attackDamageOrder = new Map<string, Unit[]>();

        // Create a list of blockers for each attacker
        for (const blocker of blockers) {
            const blocked = this.getPlayerUnitById(
                this.getCurrentPlayer().getPlayerNumber(),
                blocker.getBlockedUnitId() || ''
            );
            const id = blocked.getId();
            const order = this.attackDamageOrder.get(id);
            if (order) {
                order.push(blocker);
            } else {
                this.attackDamageOrder.set(id, [blocker]);
            }
        }

        // Set damage order according to basic A.I
        for (const attackerID of Array.from(this.attackDamageOrder.keys())) {
            const attackerBlockers = this.attackDamageOrder.get(attackerID);
            if (!attackerBlockers) {
                throw new Error('Missing blockers for attacker');
            }
            this.attackDamageOrder.set(
                attackerID,
                this.getBasicDamageDistribution(
                    this.getUnitById(attackerID),
                    attackerBlockers
                )
            );
        }

        return this.attackDamageOrder;
    }

    public getModableDamageDistributions() {
        const orderableAttacks = new Map<string, Unit[]>();
        const attackDamageOrder = this.attackDamageOrder;
        if (attackDamageOrder === null) {
            throw new Error('attackDamageOrder is undefined');
        }
        for (const attackerID of Array.from(attackDamageOrder.keys())) {
            const defenders = attackDamageOrder.get(attackerID);
            const dmg = this.getUnitById(attackerID).getDamage();
            if (defenders === undefined) {
                throw new Error(`No defenders for ${attackerID}`);
            }
            if (
                defenders.length > 1 &&
                defenders.map(unit => unit.getLife()).reduce((a, b) => a + b) >
                    dmg
            ) {
                orderableAttacks.set(attackerID, defenders);
            }
        }
        this.orderableAttacks = orderableAttacks;
        return this.orderableAttacks;
    }

    protected resolveCombat() {
        const attackers = this.getAttackers();
        const defendingPlayer = this.players[
            this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())
        ];

        if (this.attackDamageOrder === null) {
            this.generateDamageDistribution();
        }
        const attackDamageOrder = this.attackDamageOrder;
        if (attackDamageOrder === null) {
            throw new Error();
        }

        // Apply blocks in order decided by attacker
        for (const attackerID of attackDamageOrder.keys()) {
            const attacker = this.getUnitById(attackerID);
            const damageOrder = attackDamageOrder.get(attackerID) || [];
            let remainingDamage = attacker.getDamage();

            for (const blocker of damageOrder) {
                const assignedDamage = Math.min(
                    blocker.getLife(),
                    remainingDamage
                );
                remainingDamage -= assignedDamage;
                blocker.getEvents().block.trigger({ attacker });
                blocker.getEvents().attack.trigger({
                    attacker: attacker,
                    damage: assignedDamage,
                    defender: blocker
                });
                attacker.fight(blocker, assignedDamage);
                blocker.setBlocking(null);
            }
        }

        // Unblocked attackers damage the defending player
        for (const attacker of attackers) {
            if (!attackDamageOrder.has(attacker.getId())) {
                attacker.dealAndApplyDamage(
                    defendingPlayer,
                    attacker.getDamage()
                );
                attacker.setExhausted(true);
            }
            attacker.toggleAttacking();
        }

        this.attackDamageOrder = null;
        this.changePhase(GamePhase.Play2);
    }

    protected blockersExist() {
        const potentialBlockers = this.board.getPlayerUnits(
            this.getNonturnPlayer()
        );
        const attackers = this.board
            .getPlayerUnits(this.getCurrentPlayer().getPlayerNumber())
            .filter(unit => unit.isAttacking());

        for (const blocker of potentialBlockers) {
            for (const attacker of attackers) {
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

    public getPastEvents() {
        return this.events;
    }

    // Game Flow Logic (phases, turns) -------------------------------------------------

    protected changePhase(nextPhase: GamePhase) {
        this.phase = nextPhase;
        this.addGameEvent({
            type: SyncEventType.PhaseChange,
            phase: nextPhase
        });
    }

    protected startEndPhase() {
        this.gameEvents.endOfTurn.trigger({ player: this.turn });
        this.changePhase(GamePhase.End);
        this.getCurrentPlayer().discardExtra(this);
    }

    public nextTurn() {
        this.turn = this.getOtherPlayerNumber(this.turn);
        this.turnNum++;
        this.addGameEvent({
            type: SyncEventType.TurnStart,
            turn: this.turn,
            turnNum: this.turnNum
        });
        this.refresh();
    }

    public refresh() {
        this.phase = GamePhase.Play1;
        const currentPlayerEntities = this.getCurrentPlayerUnits();
        currentPlayerEntities.forEach(unit => unit.refresh());
        this.players[this.turn].startTurn();
        this.gameEvents.startOfTurn.trigger({ player: this.turn });
    }

    // Unit Zone Changes ------------------------------------------------------
    public playPermanent(permanent: Permanent) {
        const diesUponEntering = !this.board.canPlayPermanent(permanent);
        switch (permanent.getCardType()) {
            case CardType.Unit:
                this.addUnit(diesUponEntering, permanent as Unit);
                break;
            case CardType.Enchantment:
                this.addEnchantment(diesUponEntering, permanent as Enchantment);
                break;
        }
    }

    public changeUnitOwner(unit: Unit) {
        const originalOwner = unit.getOwner();
        const newOwner = this.getOtherPlayerNumber(originalOwner);

        this.removePermanent(unit);
        unit.setOwner(newOwner);
        unit.getTargeter().setTargets([]);
        unit.enterTheBattlefield(this);
        this.addUnit(!this.board.canPlayPermanent(unit), unit);
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

    private enchantmentDeathEffects(enchantment: Enchantment) {
        this.removePermanent(enchantment);
        this.addToCrypt(enchantment);
    }

    public addEnchantment(diesUponEntering: boolean, enchantment: Enchantment) {
        if (diesUponEntering) {
            this.enchantmentDeathEffects(enchantment);
            return;
        }
        enchantment
            .getEvents()
            .death.addEvent(
                undefined,
                params => this.enchantmentDeathEffects(enchantment),
                Infinity
            );
        this.board.addPermanent(enchantment);
    }

    private unitDeathEffects(unit: Unit) {
        this.removePermanent(unit);
        this.addToCrypt(unit);
        unit.detachItems(this);
        this.gameEvents.unitDies.trigger({ deadUnit: unit });
    }

    public addUnit(diesUponEntering: boolean, unit: Unit) {
        if (diesUponEntering) {
            this.unitDeathEffects(unit);
            return;
        }
        unit.getEvents().death.addEvent(
            undefined,
            () => this.unitDeathEffects(unit),
            Infinity
        );
        unit.getEvents().annihilate.addEvent(undefined, () =>
            this.removePermanent(unit)
        );
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
        return this.board
            .getAllUnits()
            .filter(unit => this.isPlayerTurn(unit.getOwner()));
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

    public getCardById(id: string): Card {
        const found = this.cardPool.get(id);
        if (!found) {
            throw new Error(`No Card with id "${id}" in pool ${this.cardPool}`);
        }
        return found;
    }

    public getUnitById(id: string): Unit {
        const unit = this.board
            .getAllUnits()
            .find(toCheck => toCheck.getId() === id);
        if (unit === undefined) {
            throw new Error(`No unit with id ${id}`);
        }
        return unit;
    }

    protected getPlayerUnitById(playerNo: number, id: string): Unit {
        const found = this.board
            .getPlayerUnits(playerNo)
            .find(unit => unit.getId() === id);
        if (!found) {
            throw new Error(`No unit with id ${id}`);
        }
        return found;
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
        return this.phase === GamePhase.Block
            ? !this.isPlayerTurn(player)
            : this.isPlayerTurn(player);
    }

    public isPlayPhase() {
        return this.phase === GamePhase.Play1 || this.phase === GamePhase.Play2;
    }
}
