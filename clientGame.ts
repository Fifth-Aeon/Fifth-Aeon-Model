import { Animator } from './animator';
import { Card, CardType } from './card';
import { cardList } from './cards/cardList';
import { Enchantment } from './enchantment';
import { Game, GameActionType, GamePhase, GameSyncEvent, SyncEventType } from './game';

import { GameFormat, standardFormat } from './gameFormat';
import { Item } from './item';
import { Log } from './log';
import { Player } from './player';
import { Unit } from './unit';



export class ClientGame extends Game {
    // Handlers to synchronize events
    protected syncEventHandlers: Map<SyncEventType, (playerNo: number, event: GameSyncEvent, params: any) => void>;
    // The player number of the player contorting this game
    private owningPlayer: number;

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
        this.syncEventHandlers = new Map<SyncEventType, (playerNo: number, event: GameSyncEvent) => void>();
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
            id: card.getId(), targetIds: targetIds,
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

    public modifyEnchantment(player: Player, enchantment: Enchantment) {
        if (!enchantment.canChangePower(player, this))
            return false;
        enchantment.empowerOrDiminish(player, this);
        this.runGameAction(GameActionType.ModifyEnchantment, { enchantmentId: enchantment.getId() });
    }

    public canAttackWith(unit: Unit) {
        return this.isPlayerTurn(this.owningPlayer) && this.phase === GamePhase.Play1  && unit.canAttack()
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
            console.error(`Reject choice. Out of range cards but only got ${cards.length}.`);
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

    public pass() {
        if (this.players[this.owningPlayer].canPlayResource())
            return false;
        this.runGameAction(GameActionType.Pass, {});
    }

    public setOwningPlayer(player: number) {
        this.owningPlayer = player;
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
    /**
     * Syncs an event that happened on the server into the state of this game model
     *
     * @param {number} localPlayerNumber
     * @param {GameSyncEvent} event
     * @memberof Game
     */
    public syncServerEvent(localPlayerNumber: number, event: GameSyncEvent) {
        let params = event.params;
        this.events.push(event);
        let handler = this.syncEventHandlers.get(event.type);
        if (handler)
            handler(localPlayerNumber, event, params);
    }

    private idsToCards(ids: Array<string>) {
        return ids.map(id => this.getCardById(id));
    }

    public unpackCard(proto: { id: string, data: string, owner: number }) {
        if (this.cardPool.has(proto.id))
            return this.cardPool.get(proto.id);
        let card = cardList.getCard(proto.data);
        card.setId(proto.id);
        card.setOwner(proto.owner);
        this.cardPool.set(proto.id, card);
        return card;
    }

    private addSyncHandler(type: SyncEventType, cb: (playerNo: number, event: GameSyncEvent, params: any) => void) {
        this.syncEventHandlers.set(type, cb.bind(this));
    }

    private addSyncHandlers() {
        this.addSyncHandler(SyncEventType.AttackToggled, this.syncAttackToggled);
        this.addSyncHandler(SyncEventType.TurnStart, this.syncTurnStart);
        this.addSyncHandler(SyncEventType.PhaseChange, this.syncPhaseChange);
        this.addSyncHandler(SyncEventType.PlayResource, this.syncPlayResource);
        this.addSyncHandler(SyncEventType.PlayCard, this.syncCardEvent);
        this.addSyncHandler(SyncEventType.Block, this.syncBlock);
        this.addSyncHandler(SyncEventType.Draw, this.syncDrawEvent);
        this.addSyncHandler(SyncEventType.ChoiceMade, this.syncChoiceMade);
        this.addSyncHandler(SyncEventType.QueryResult, this.syncQueryResult);
        this.addSyncHandler(SyncEventType.Ended, this.syncEnded);
        this.addSyncHandler(SyncEventType.EnchantmentModified, this.syncModifyEnchantment);
        this.addSyncHandler(SyncEventType.DamageDistributed, this.syncDamageDistribution);
    }

    private syncDamageDistribution(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (localPlayerNumber === this.getCurrentPlayer().getPlayerNumber())
            return;
        let attackerID = params.attackerID as string;
        let order = params.order as string[];
        this.attackDamageOrder.set(attackerID, order.map(id => this.getUnitById(id)));
    }

    private syncCardEvent(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (params.playerNo !== localPlayerNumber) {
            let player = this.players[params.playerNo];
            let card = this.unpackCard(params.played);
            if (params.targetIds) {
                card.getTargeter().setTargets(params.targetIds
                    .map((id: string) => this.getUnitById(id)));
            }
            if (card.getCardType() === CardType.Item) {
                (card as Item).getHostTargeter().setTargets([this.getUnitById(params.hostId)]);
            }
            this.playCard(player, card);
        }
        if (this.log)
            this.log.addCardPlayed(event);
    }

    private syncModifyEnchantment(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (localPlayerNumber === this.getCurrentPlayer().getPlayerNumber())
            return;
        let enchantment = this.getCardById(params.enchantmentId) as Enchantment;
        enchantment.empowerOrDiminish(this.getCurrentPlayer(), this);
    }

    private syncDrawEvent(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (params.fatigue)
            this.players[params.playerNo].fatigue()
        else if (params.discarded)
            this.addToCrypt(this.unpackCard(params.card));
        else
            this.players[params.playerNo].addToHand(this.unpackCard(params.card));
    }

    private syncTurnStart(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (this.turnNum === 1) {
            this.mulligan();
            this.turn = params.turn;
            this.turnNum = params.turnNum;
            this.refresh();
        }
    }

    private syncPlayResource(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (params.playerNo != localPlayerNumber)
            this.players[params.playerNo].playResource(params.resource);
    }

    private syncAttackToggled(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player !== localPlayerNumber)
            this.getUnitById(params.unitId).toggleAttacking();
    }

    private syncBlock(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player !== localPlayerNumber) {
            this.getUnitById(params.blockerId).setBlocking(params.blockedId);
        }
    }

    private syncPhaseChange(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (event.params.phase === GamePhase.Block)
            this.gameEvents.playerAttacked.trigger(
                { target: this.getOtherPlayerNumber(this.getActivePlayer()) }
            );
        if (event.params.phase === GamePhase.Play2) {
            this.resolveCombat();
        }
        if (event.params.phase === GamePhase.DamageDistribution)
            this.generateDamageDistribution();
        if (event.params.phase === GamePhase.End)
            this.startEndPhase();
        else
            this.changePhase(event.params.phase);
    }

    private syncChoiceMade(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player !== localPlayerNumber)
            this.makeDeferredChoice(params.player, this.idsToCards(params.choice));
    }

    private syncQueryResult(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        let cards = params.cards.map((proto: { id: string, data: string, owner: number }) => this.unpackCard(proto));
        this.setQueryResult(cards);
    }

    private syncEnded(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        this.winner = event.params.winner;
    }
}
