import { Game, GamePhase, GameActionType, SyncEventType, GameAction, GameSyncEvent } from './game';
import { data } from './gameData';
import { GameFormat, standardFormat } from './gameFormat';
import { Log } from './log';

import { Player } from './player';
import { Card, CardType } from './card';
import { Unit } from './unit';
import { Item } from './item';
import { Enchantment } from './enchantment';
import { Resource, ResourceTypeNames } from './resource';

import { maxBy } from 'lodash'

export class ClientGame extends Game {
    // Handlers to syncronize events
    protected syncEventHandlers: Map<SyncEventType, (playerNo: number, event: GameSyncEvent, params: any) => void>;

    constructor(
        protected runGameAction: (type: GameActionType, params: any) => void,
        log: Log = null,
        format: GameFormat = standardFormat
    ) {
        super(format, true);
        this.log = log;
        if (this.log)
            this.log.attachToGame(this);
        this.syncEventHandlers = new Map<SyncEventType, (playerNo: number, event: GameSyncEvent) => void>();
        this.addSyncHandlers();
    }

    public getLog() {
        return this.log;
    }

    // Game Actions ----------------------------------------------------------
    public playCardExtern(card: Card, targets: Unit[] = [], host: Unit = null) {
        let targetIds = targets.map(target => target.getId());
        card.getTargeter().setTargets(targets);
        if (card.getCardType() == CardType.Item) {
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

    public makeChoice(cards: Card[]) {
        this.makeDeferedChoice(cards);
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

    // Syncronization Logic --------------------------------------------------------
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
        if (handler)
            handler(playerNumber, event, params);
    }

    private idsToCards(ids: Array<string>) {
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

    private syncCardEvent(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.playerNo != playerNumber) {
            let player = this.players[params.playerNo];
            let card = this.unpackCard(params.played)
            if (params.targetIds) {
                card.getTargeter().setTargets(params.targetIds
                    .map((id: string) => this.getUnitById(id)));
            }
            if (card.getCardType() == CardType.Item) {
                (card as Item).getHostTargeter().setTargets([this.getUnitById(params.hostId)]);
            }
            this.playCard(player, card);
        }
        if (this.log)
            this.log.addCardPlayed(event);
    }

    private syncModifyEnchantment(playerNumber: number, event: GameSyncEvent, params: any) {
        if (playerNumber == this.getCurrentPlayer().getPlayerNumber())
            return;
        let enchantment = this.getCardById(params.params.enchantmentId) as Enchantment;
        enchantment.empowerOrDiminish(this.getCurrentPlayer(), this);
    }

    private syncDrawEvent(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.discarded)
            this.addToCrypt(this.unpackCard(params.card));
        else
            this.players[params.playerNo].addToHand(this.unpackCard(params.card))
    }

    private syncTurnStart(playerNumber: number, event: GameSyncEvent, params: any) {
        if (this.turnNum == 1) {
            this.turn = params.turn;
            this.turnNum = params.turnNum
            this.refresh();
        }
    }

    private syncPlayResource(playerNumber: number, event: GameSyncEvent, params: any) {
        this.players[params.playerNo].playResource(params.resource);
    }

    private syncAttackToggled(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player != playerNumber)
            this.getUnitById(params.unitId).toggleAttacking();
    }

    private syncBlock(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player != playerNumber) {
            this.getUnitById(params.blockerId).setBlocking(params.blockedId);
        }
    }

    private syncPhaseChange(playerNumber: number, event: GameSyncEvent, params: any) {
        if (event.params.phase === GamePhase.Play2)
            this.resolveCombat();
        if (event.params.phase === GamePhase.End)
            this.startEndPhase();
        else
            this.changePhase(event.params.phase);
    }

    private syncChoiceMade(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player != playerNumber)
            this.makeDeferedChoice(this.idsToCards(params.choice));
    }

    private syncQueryResult(playerNumber: number, event: GameSyncEvent, params: any) {
        let cards = params.cards.map((proto: { id: string, data: string, owner: number }) => this.unpackCard(proto));
        this.setQueryResult(cards);
    }

    private syncEnded(playerNumber: number, event: GameSyncEvent, params: any) {
        this.winner = event.params.winner;
    }
}
