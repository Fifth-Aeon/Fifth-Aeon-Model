import { CardPrototype } from '../card';
import { Choice, GamePhase } from '../game';
import { Resource } from '../resource';

export enum SyncEventType {
    AttackToggled, TurnStart, PhaseChange, PlayResource,
    PlayCard, Block, Draw, ChoiceMade, QueryResult, Ended, EnchantmentModified,
    DamageDistributed
}

interface GameSyncEventBase {
    readonly number: number;
    readonly type: SyncEventType;
}

export type GameSyncEvent = SyncAttackToggled | SyncTurnStart | SyncPhaseChange |
    SyncPlayResource | SyncPlayCard | SyncBlock | SyncDraw | SyncChoiceMade | SyncQueryResult |
    SyncEnded | SyncEnchantmentModified | SyncDamageDistributed;


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
    readonly hostId: string;
}

export interface SyncBlock extends GameSyncEventBase {
    readonly type: SyncEventType.Block;
    readonly player: number;
    readonly blockerId: string;
    readonly blockedId: string;
}

export interface SyncDraw extends GameSyncEventBase {
    readonly type: SyncEventType.Draw;
    readonly playerNo: number;
    readonly card: CardPrototype;
    readonly discarded: boolean;
    readonly fatigue: boolean;
}

export interface SyncChoiceMade extends GameSyncEventBase {
    readonly type: SyncEventType.ChoiceMade;
    readonly player: number;
    readonly choice: Choice;
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

