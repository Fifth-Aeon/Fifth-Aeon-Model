import { Game, GamePhase, GameActionType, SyncEventType, GameAction, GameSyncEvent } from './game';
import { data } from './gameData';
import { GameFormat, standardFormat } from './gameFormat';
import { Log } from './log';

export class ClientGame extends Game {
    // Handlers to syncronize events
    protected syncEventHandlers: Map<SyncEventType, (playerNo: number, event: GameSyncEvent, params: any) => void>;

    constructor(log: Log = null, format: GameFormat = standardFormat,) {
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
        if (params.player != playerNumber)
            this.getUnitById(params.unitId).toggleAttacking();
    }

    public syncBlock(playerNumber: number, event: GameSyncEvent, params: any) {
        if (params.player != playerNumber) {
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
}
