import { CardPrototype } from '../card-types/card';
import { GamePhase } from '../game';
import { Resource } from '../resource';

export enum SyncEventType {
    AttackToggled,
    TurnStart,
    PhaseChange,
    PlayResource,
    PlayCard,
    Block,
    Draw,
    ChoiceMade,
    QueryResult,
    Ended,
    EnchantmentModified,
    DamageDistributed,
    PriortyGained
}

interface GameSyncEventBase {
    number?: number;
    readonly type: SyncEventType;
}

export type GameSyncEvent =
    | SyncAttackToggled
    | SyncTurnStart
    | SyncPriorityGained
    | SyncPhaseChange
    | SyncPlayResource
    | SyncPlayCard
    | SyncBlock
    | SyncDraw
    | SyncFatigue
    | SyncChoiceMade
    | SyncQueryResult
    | SyncEnded
    | SyncEnchantmentModified
    | SyncDamageDistributed;

type SyncEventFromType<
    T extends SyncEventType
> = T extends SyncEventType.AttackToggled
    ? SyncAttackToggled
    : T extends SyncEventType.Block
    ? SyncBlock
    : T extends SyncEventType.ChoiceMade
    ? SyncBlock
    : T extends SyncEventType.PriortyGained
    ? SyncPriorityGained
    : T extends SyncEventType.DamageDistributed
    ? SyncDamageDistributed
    : T extends SyncEventType.Draw
    ? SyncDraw | SyncFatigue
    : T extends SyncEventType.EnchantmentModified
    ? SyncEnchantmentModified
    : T extends SyncEventType.Ended
    ? SyncEnded
    : T extends SyncEventType.PhaseChange
    ? SyncPhaseChange
    : T extends SyncEventType.PlayCard
    ? SyncPlayCard
    : T extends SyncEventType.PlayResource
    ? SyncPlayResource
    : T extends SyncEventType.QueryResult
    ? SyncQueryResult
    : SyncTurnStart;

export class SyncEventSystem {
    private handlers = new Map<
        SyncEventType,
        (localPlayerNumber: number, event: GameSyncEvent) => void
    >();

    constructor(private parent: Object) {}

    public addHandler<T extends SyncEventType>(
        type: T,
        handler: (
            localPlayerNumber: number,
            event: SyncEventFromType<T>
        ) => void
    ) {
        this.handlers.set(type, handler.bind(this.parent) as (
            localPlayerNumber: number,
            event: GameSyncEvent
        ) => void);
    }

    public handleEvent(localPlayerNumber: number, event: GameSyncEvent) {
        const handler = this.handlers.get(event.type);
        return handler ? handler(localPlayerNumber, event) : false;
    }
}

export interface SyncPriorityGained extends GameSyncEventBase {
    readonly type: SyncEventType.PriortyGained;
    readonly player: number;
}

export interface SyncAttackToggled extends GameSyncEventBase {
    readonly type: SyncEventType.AttackToggled;
    readonly player: number;
    readonly unitId: string;
}

export interface SyncTurnStart extends GameSyncEventBase {
    readonly type: SyncEventType.TurnStart;
    readonly turn: number;
    readonly turnNum: number;
}

export interface SyncPhaseChange extends GameSyncEventBase {
    readonly type: SyncEventType.PhaseChange;
    readonly phase: GamePhase;
}

export interface SyncPlayResource extends GameSyncEventBase {
    readonly type: SyncEventType.PlayResource;
    readonly playerNo: number;
    readonly resource: Resource;
}

export interface SyncPlayCard extends GameSyncEventBase {
    readonly type: SyncEventType.PlayCard;
    readonly playerNo: number;
    readonly played: CardPrototype;
    readonly targetIds: string[];
    readonly hostId?: string;
}

export interface SyncBlock extends GameSyncEventBase {
    readonly type: SyncEventType.Block;
    readonly player: number;
    readonly blockerId: string;
    readonly blockedId: string | null;
}

export interface SyncDraw extends GameSyncEventBase {
    readonly type: SyncEventType.Draw;
    readonly fatigue: false;

    readonly playerNo: number;
    readonly card: CardPrototype;
    readonly discarded: boolean;
}

export interface SyncFatigue extends GameSyncEventBase {
    readonly type: SyncEventType.Draw;
    readonly fatigue: true;
    readonly playerNo: number;
}

export interface SyncChoiceMade extends GameSyncEventBase {
    readonly type: SyncEventType.ChoiceMade;
    readonly player: number;
    readonly choice: string[];
}

export interface SyncQueryResult extends GameSyncEventBase {
    readonly type: SyncEventType.QueryResult;
    readonly cards: CardPrototype[];
}

export interface SyncEnded extends GameSyncEventBase {
    readonly type: SyncEventType.Ended;
    readonly winner: number;
    readonly quit: boolean;
}

export interface SyncEnchantmentModified extends GameSyncEventBase {
    readonly type: SyncEventType.EnchantmentModified;
    readonly enchantmentId: string;
}

export interface SyncDamageDistributed extends GameSyncEventBase {
    readonly type: SyncEventType.DamageDistributed;
    readonly attackerID: string;
    readonly order: string[];
}
