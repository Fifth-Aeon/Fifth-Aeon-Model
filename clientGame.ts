import { Animator } from './animator';
import { Card, CardPrototype, CardType } from './card';
import { cardList } from './cards/cardList';
import { Enchantment } from './enchantment';
import { GameActionType } from './events/gameAction';
import {
    GameSyncEvent, SyncAttackToggled, SyncBlock, SyncChoiceMade, SyncDamageDistributed,
    SyncDraw, SyncEnchantmentModified, SyncEnded, SyncEventSystem, SyncEventType, SyncPhaseChange,
    SyncPlayCard, SyncPlayResource, SyncQueryResult, SyncTurnStart, SyncFatigue
} from './events/syncEvent';
import { Game, GamePhase } from './game';
import { GameFormat, standardFormat } from './gameFormat';
import { Item } from './item';
import { Log } from './log';
import { Player } from './player';
import { ServerGame } from './serverGame';
import { Unit } from './unit';





export class ClientGame extends Game {
    private syncSystem = new SyncEventSystem(this);
    // The player number of the player contorting this game
    private owningPlayer: number;
    private nextExpectedEvent = 0;
    protected onQueryResult: (cards: Card[]) => void;
    protected queryData: Card[] = null;

    public onSync: () => void;


    constructor(
        name: string,
        protected runGameAction: (type: GameActionType, params: any) => void,
        private animator: Animator,
        log: Log = null,
        format: GameFormat = standardFormat
    ) {
        super(name, format);
        this.log = log;
        if (this.log)
            this.log.attachToGame(this);
        this.addSyncHandlers();

        this.players = [
            new Player(this, [], 0, this.format.initialResource[0], this.format.initialLife[0]),
            new Player(this, [], 1, this.format.initialResource[1], this.format.initialLife[1])
        ];

        for (let i = 0; i < this.players.length; i++) {
            this.players[i].disableDraw();
            for (let j = 0; j < this.format.initialDraw[i]; j++)
                this.players[i].drawCard();
        }
        this.addDeathHandlers();

    }

    public getLog() {
        return this.log;
    }


    // Game Actions ----------------------------------------------------------

    /** Checks if the player controlling this game can play a given card with given targets */
    public canPlayCard(card: Card, targets: Unit[] = [], host: Unit = null) {
        if (!this.isPlayerTurn(this.owningPlayer))
            return false;
        if (!card.isPlayable(this))
            return false;
        card.getTargeter().setTargets(targets);
        if (!card.getTargeter().targetsAreValid(card, this))
            return false;
        // Item Host
        if (card.getCardType() === CardType.Item) {
            let item = card as Item;
            item.getHostTargeter().setTargets([host]);
            if (!item.getHostTargeter().targetsAreValid(card, this))
                return false;
        }
        return true;
    }

    public playCardExtern(card: Card, targets: Unit[] = [], host: Unit = null) {
        if (!this.canPlayCard(card, targets, host))
            return false;
        let targetIds = targets.map(target => target.getId());
        card.getTargeter().setTargets(targets);
        if (card.getCardType() === CardType.Item) {
            if (!host)
                console.error('Item', card.getName(), 'requires a host.');
            (card as Item).getHostTargeter().setTargets([host]);
        }
        this.runGameAction(GameActionType.PlayCard, {
            id: card.getId(),
            targetIds: targetIds,
            hostId: host ? host.getId() : null
        });
        this.playCard(this.players[card.getOwner()], card);

    }

    public setAttackOrder(attacker: Unit, order: Unit[]) {
        this.attackDamageOrder.set(attacker.getId(), order);
        this.runGameAction(GameActionType.DistributeDamage, {
            attackerID: attacker.getId(),
            order: order.map(unit => unit.getId())
        });
    }

    public canModifyEnchantment(enchantment: Enchantment) {
        return enchantment.canChangePower(this.getPlayer[this.owningPlayer], this);
    }

    public modifyEnchantment(player: Player, enchantment: Enchantment) {
        if (!enchantment.canChangePower(player, this))
            return false;
        enchantment.empowerOrDiminish(player, this);
        this.runGameAction(GameActionType.ModifyEnchantment, { enchantmentId: enchantment.getId() });
    }

    public canAttackWith(unit: Unit) {
        return this.isPlayerTurn(this.owningPlayer) && this.phase === GamePhase.Play1 && unit.canAttack();
    }

    public declareAttacker(unit: Unit) {
        if (!this.canAttackWith(unit))
            return false;
        unit.toggleAttacking();
        this.runGameAction(GameActionType.ToggleAttack, { unitId: unit.getId() });
    }

    public declareBlocker(blocker: Unit, attacker: Unit | null) {
        if (!blocker.canBlockTarget(attacker))
            return false;
        let attackerId = attacker ? attacker.getId() : null;
        blocker.setBlocking(attackerId);
        this.runGameAction(GameActionType.DeclareBlocker, {
            blockerId: blocker.getId(),
            blockedId: attackerId
        });
    }

    public canMakeChoice(player: number, cards: Card[]) {
        if (this.currentChoices[player] === null) {
            console.error('Reject choice from', player);
            return false;
        }
        let min = Math.min(this.currentChoices[player].validCards.size, this.currentChoices[player].min);
        let max = this.currentChoices[player].max;
        if (cards.length > max || cards.length < min) {
            console.error(`Reject choice. Wanted between ${min} and ${max} cards but got ${cards.length}.`);
            return false;
        }
        if (!cards.every(card => this.currentChoices[player].validCards.has(card))) {
            console.error(`Reject choice. Included invalid options.`, cards, this.currentChoices[player].validCards);
            return false;
        }
        return true;
    }

    public makeChoice(player: number, cards: Card[]) {
        if (!this.canMakeChoice(player, cards))
            return false;
        this.makeDeferredChoice(player, cards);
        this.runGameAction(GameActionType.CardChoice, {
            choice: cards.map(card => card.getId())
        });
    }

    public canPlayResource(): boolean {
        return this.isPlayerTurn(this.owningPlayer) && this.players[this.owningPlayer].canPlayResource();
    }

    public playResource(type: string) {
        if (!this.canPlayResource())
            return false;
        let res = this.format.basicResources.get(type);
        this.players[this.owningPlayer].playResource(res);
        this.runGameAction(GameActionType.PlayResource, { type: type });
    }

    private wouldEndTurn() {
        return this.isPlayerTurn(this.owningPlayer) &&
            (this.getPhase() === GamePhase.Play1 && !this.isAttacking()) ||
            (this.getPhase() === GamePhase.Play2);
    }

    public pass() {
        if (this.players[this.owningPlayer].canPlayResource() && this.wouldEndTurn())
            return false;
        this.runGameAction(GameActionType.Pass, {});
    }

    public setOwningPlayer(player: number) {
        this.owningPlayer = player;
    }

    public queryCards(getCards: (game: ServerGame) => Card[], callback: (cards: Card[]) => void) {
        if (this.queryData) {
            callback(this.queryData);
            this.queryData = null;
        } else {
            this.onQueryResult = callback;
        }
    }


    // Animation logic

    protected async resolveCombat() {
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        if (this.attackDamageOrder === null) {
            this.generateDamageDistribution();
        }

        this.animator.startAnimation();

        // Apply blocks in order decided by attacker
        for (let attackerID of Array.from(this.attackDamageOrder.keys())) {
            let attacker = this.getUnitById(attackerID);
            let damageOrder = this.attackDamageOrder.get(attackerID);
            let remainingDamage = attacker.getDamage();

            this.animator.triggerBattleAnimation({
                defendingPlayer: defendingPlayer,
                attacker: attacker,
                defenders: damageOrder
            });

            for (let blocker of damageOrder) {
                await this.animator.getAnimationDelay(damageOrder.length * 2);
                let assignedDamage = Math.min(blocker.getLife(), remainingDamage);
                remainingDamage -= assignedDamage;
                blocker.getEvents().block.trigger({ attacker });
                blocker.getEvents().attack.trigger({ attacker: attacker, damage: assignedDamage, defender: blocker });
                attacker.fight(blocker, assignedDamage);
                blocker.setBlocking(null);
                await this.animator.getAnimationDelay(damageOrder.length * 2);
            }
        }

        // Unblocked attackers damage the defending player
        for (let attacker of attackers) {
            if (!this.attackDamageOrder.has(attacker.getId())) {
                this.animator.triggerBattleAnimation({
                    defendingPlayer: defendingPlayer,
                    attacker: attacker,
                    defenders: []
                });
                await this.animator.getAnimationDelay(2);
                attacker.dealAndApplyDamage(defendingPlayer, attacker.getDamage());
                attacker.toggleAttacking();
                attacker.setExhausted(true);
                await this.animator.getAnimationDelay(2);
            } else {
                attacker.toggleAttacking();
            }

        }

        this.animator.endAnimation();
        this.attackDamageOrder = null;
        this.changePhase(GamePhase.Play2);
    }


    // Synchronization Logic --------------------------------------------------------

    public isSyncronized() {
        return this.getExpectedCards() === 0;
    }


    /**
     * Syncs an event that happened on the server into the state of this game model
     *
     * @param {number} localPlayerNumber
     * @param {GameSyncEvent} event
     * @memberof Game
     */
    public syncServerEvent(localPlayerNumber: number, event: GameSyncEvent) {

        if (event.number !== this.nextExpectedEvent) {
            console.error('Event arrived out of order', event.number, this.events.length);
        }
        this.events.push(event);
        try {
            this.syncSystem.handleEvent(localPlayerNumber, event);
        } catch (e) {
            console.error('Error while syncing event', SyncEventType[event.type], event, 'for', localPlayerNumber);
            throw e;
        }

        this.nextExpectedEvent++;

    }

    private idsToCards(ids: Array<string>) {
        return ids.map(id => this.getCardById(id));
    }

    public unpackCard(proto: CardPrototype) {
        if (this.cardPool.has(proto.id))
            return this.cardPool.get(proto.id);
        let card = cardList.getCard(proto.data);
        card.setId(proto.id);
        card.setOwner(proto.owner);
        this.cardPool.set(proto.id, card);
        return card;
    }

    private addSyncHandlers() {
        this.syncSystem.addHandler(SyncEventType.AttackToggled, this.syncAttackToggled);
        this.syncSystem.addHandler(SyncEventType.TurnStart, this.syncTurnStart);
        this.syncSystem.addHandler(SyncEventType.PhaseChange, this.syncPhaseChange);
        this.syncSystem.addHandler(SyncEventType.PlayResource, this.syncPlayResource);
        this.syncSystem.addHandler(SyncEventType.PlayCard, this.syncCardEvent);
        this.syncSystem.addHandler(SyncEventType.Block, this.syncBlock);
        this.syncSystem.addHandler(SyncEventType.Draw, this.syncDrawEvent);
        this.syncSystem.addHandler(SyncEventType.ChoiceMade, this.syncChoiceMade);
        this.syncSystem.addHandler(SyncEventType.QueryResult, this.syncQueryResult);
        this.syncSystem.addHandler(SyncEventType.Ended, this.syncEnded);
        this.syncSystem.addHandler(SyncEventType.EnchantmentModified, this.syncModifyEnchantment);
        this.syncSystem.addHandler(SyncEventType.DamageDistributed, this.syncDamageDistribution);
    }

    private syncDamageDistribution(localPlayerNumber: number, event: SyncDamageDistributed) {
        if (localPlayerNumber === this.getCurrentPlayer().getPlayerNumber())
            return;
        let attackerID = event.attackerID as string;
        let order = event.order as string[];
        this.attackDamageOrder.set(attackerID, order.map(id => this.getUnitById(id)));
    }

    private syncCardEvent(localPlayerNumber: number, event: SyncPlayCard) {
        if (event.playerNo !== localPlayerNumber) {
            let player = this.players[event.playerNo];
            let card = this.unpackCard(event.played);
            if (event.targetIds) {
                card.getTargeter().setTargets(event.targetIds
                    .map((id: string) => this.getUnitById(id)));
            }
            if (card.getCardType() === CardType.Item) {
                (card as Item).getHostTargeter().setTargets([this.getUnitById(event.hostId)]);
            }
            this.playCard(player, card);
        }
        if (this.log)
            this.log.addCardPlayed(event);
    }

    private syncModifyEnchantment(localPlayerNumber: number, event: SyncEnchantmentModified) {
        if (localPlayerNumber === this.getCurrentPlayer().getPlayerNumber())
            return;
        let enchantment = this.getCardById(event.enchantmentId) as Enchantment;
        enchantment.empowerOrDiminish(this.getCurrentPlayer(), this);
    }

    public getExpectedCards() {
        return Math.abs(this.players[0].getExpectedDraws()) + Math.abs(this.players[1].getExpectedDraws());
    }

    private syncDrawEvent(localPlayerNumber: number, event: SyncDraw | SyncFatigue) {
        if (event.fatigue === true)
            this.players[event.playerNo].fatigue();
        else if (event.discarded)
            this.addToCrypt(this.unpackCard(event.card));
        else
            this.players[event.playerNo].addToHand(this.unpackCard(event.card));

        this.players[event.playerNo].setCardSynced();
        if (this.isSyncronized() && this.onSync) {
            this.onSync();
            this.onSync = undefined;
        }
    }

    private syncTurnStart(localPlayerNumber: number, event: SyncTurnStart) {
        if (this.turnNum === 1) {
            this.mulligan();
            this.turn = event.turn;
            this.turnNum = event.turnNum;
            this.refresh();
        }
    }

    private syncPlayResource(localPlayerNumber: number, event: SyncPlayResource) {
        if (event.playerNo !== localPlayerNumber)
            this.players[event.playerNo].playResource(event.resource);
    }

    private syncAttackToggled(localPlayerNumber: number, event: SyncAttackToggled) {
        if (event.player !== localPlayerNumber)
            this.getUnitById(event.unitId).toggleAttacking();
    }

    private syncBlock(localPlayerNumber: number, event: SyncBlock) {
        if (event.player !== localPlayerNumber) {
            this.getUnitById(event.blockerId).setBlocking(event.blockedId);
        }
    }

    private syncPhaseChange(localPlayerNumber: number, event: SyncPhaseChange) {
        if (event.phase === GamePhase.Block)
            this.gameEvents.playerAttacked.trigger(
                { target: this.getOtherPlayerNumber(this.getActivePlayer()) }
            );
        if (event.phase === GamePhase.Play2) {
            this.resolveCombat();
        }
        if (event.phase === GamePhase.DamageDistribution)
            this.generateDamageDistribution();

        if (event.phase === GamePhase.End)
            this.startEndPhase();
        else
            this.changePhase(event.phase);
    }

    private syncChoiceMade(localPlayerNumber: number, event: SyncChoiceMade) {
        if (event.player !== localPlayerNumber)
            this.makeDeferredChoice(event.player, this.idsToCards(event.choice));
    }


    private setQueryResult(cards: Card[]) {
        if (this.onQueryResult)
            this.onQueryResult(cards);
        else
            this.queryData = cards;
    }


    private syncQueryResult(localPlayerNumber: number, event: SyncQueryResult) {
        let cards = event.cards.map(proto => this.unpackCard(proto));
        this.setQueryResult(cards);
    }

    private syncEnded(localPlayerNumber: number, event: SyncEnded) {
        this.winner = event.winner;
    }
}
