import { Animator } from './animator';
import { Card, CardType } from './card';
import { cardList } from './cards/cardList';
import { Enchantment } from './enchantment';
import { Game, GameActionType, GamePhase, GameSyncEvent, SyncEventType } from './game';
import { EventType } from './gameEvent';
import { GameFormat, standardFormat } from './gameFormat';
import { Item } from './item';
import { Log } from './log';
import { Player } from './player';
import { Unit } from './unit';



export class ClientGame extends Game {
    // Handlers to syncronize events
    protected syncEventHandlers: Map<SyncEventType, (playerNo: number, event: GameSyncEvent, params: any) => void>;

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
            new Player(this, [], 0, this.format.initalResource[0], this.format.initialLife[0]),
            new Player(this, [], 1, this.format.initalResource[1], this.format.initialLife[1])
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
    public playCardExtern(card: Card, targets: Unit[] = [], host: Unit = null) {
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
            return;
        enchantment.empowerOrDiminish(player, this);
        this.runGameAction(GameActionType.ModifyEnchantment, { enchantmentId: enchantment.getId() });
    }

    public declareAttacker(unit: Unit) {
        unit.toggleAttacking();
        this.runGameAction(GameActionType.ToggleAttack, { unitId: unit.getId() });
    }

    public declareBlocker(blocker: Unit, attacker: Unit | null) {
        let attackerId = attacker ? attacker.getId() : null;
        blocker.setBlocking(attackerId);
        this.runGameAction(GameActionType.DeclareBlocker, {
            blockerId: blocker.getId(),
            blockedId: attackerId
        });
    }

    public makeChoice(player: number, cards: Card[]) {
        this.makeDeferedChoice(player, cards);
        this.runGameAction(GameActionType.CardChoice, {
            choice: cards.map(card => card.getId())
        });
    }

    public playResource(type: string) {
        this.runGameAction(GameActionType.PlayResource, { type: type });
    }

    public pass() {
        this.runGameAction(GameActionType.Pass, {});
    }


    // Animation logic

    protected async resolveCombat() {
        let attackers = this.getAttackers();
        let blockers = this.getBlockers();
        let defendingPlayer = this.players[this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())];

        if (this.attackDamageOrder === null) {
            this.generateDamageDistribution();
        }

        this.animator.startAnimiation();

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
                blocker.getEvents().trigger(EventType.Block, new Map([['attacker', attacker]]));
                blocker.getEvents().trigger(EventType.Attack, new Map([['blocker', blocker]]));
                attacker.fight(blocker, assignedDamage);
                blocker.setBlocking(null);
                await this.animator.getAnimationDelay(damageOrder.length * 2);
            }
        }

        // Unblocked attackers damage the defening player
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
                attacker.setExausted(true);
                await this.animator.getAnimationDelay(2);
            } else {
                attacker.toggleAttacking();
            }

        }

        this.animator.endAnimiation();
        this.attackDamageOrder = null;
        this.changePhase(GamePhase.Play2);
    }


    // Syncronization Logic --------------------------------------------------------
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
        if (params.discarded)
            this.addToCrypt(this.unpackCard(params.card));
        else
            this.players[params.playerNo].addSyncedToHand(this.unpackCard(params.card));
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
            this.gameEvents.trigger(EventType.PlayerAttacked,
                new Map([['target', this.getOtherPlayerNumber(this.getActivePlayer())]]));
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
            this.makeDeferedChoice(params.player, this.idsToCards(params.choice));
    }

    private syncQueryResult(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        let cards = params.cards.map((proto: { id: string, data: string, owner: number }) => this.unpackCard(proto));
        this.setQueryResult(cards);
    }

    private syncEnded(localPlayerNumber: number, event: GameSyncEvent, params: any) {
        this.winner = event.params.winner;
    }
}
