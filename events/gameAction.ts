export enum GameActionType {
    PlayResource,
    PlayCard,
    Pass,
    ModifyEnchantment,
    ToggleAttack,
    DeclareBlocker,
    DistributeDamage,
    CardChoice,
    Quit
}

interface GameActionBase {
    readonly type: GameActionType;
    player: number;
}

export class GameActionSystem {
    private handlers = new Map<GameActionType, (act: GameAction) => boolean>();

    constructor(private parent: Object) {}

    public addHandler<T extends GameActionType>(
        type: T,
        handler: ((action: GameActionFromType<T>) => boolean)
    ) {
        this.handlers.set(type, handler.bind(this.parent) as (
            act: GameAction
        ) => boolean);
    }

    public handleAction(action: GameAction) {
        const handler = this.handlers.get(action.type);
        if (!handler) {
            return false;
        }
        return handler(action);
    }
}

export type GameAction =
    | PlayResourceAction
    | PlayCardAction
    | PassAction
    | ModifyEnchantmentAction
    | ToggleAttackAction
    | DeclareBlockerAction
    | DistributeDamageAction
    | CardChoiceAction
    | QuitAction;

type GameActionFromType<
    T extends GameActionType
> = T extends GameActionType.CardChoice
    ? CardChoiceAction
    : T extends GameActionType.DeclareBlocker
    ? DeclareBlockerAction
    : T extends GameActionType.DistributeDamage
    ? DistributeDamageAction
    : T extends GameActionType.ModifyEnchantment
    ? ModifyEnchantmentAction
    : T extends GameActionType.Pass
    ? PassAction
    : T extends GameActionType.PlayCard
    ? PlayCardAction
    : T extends GameActionType.PlayResource
    ? PlayResourceAction
    : T extends GameActionType.Quit
    ? QuitAction
    : ToggleAttackAction;

export interface PlayResourceAction extends GameActionBase {
    readonly type: GameActionType.PlayResource;
    readonly resourceType: string;
}

export type GameActionRunner = <T extends GameActionType>(
    type: T,
    action: GameActionFromType<T>
) => void;

export interface PlayCardAction extends GameActionBase {
    readonly type: GameActionType.PlayCard;
    readonly id: string;
    readonly targetIds: string[];
    readonly hostId?: string;
}

export interface PassAction extends GameActionBase {
    readonly type: GameActionType.Pass;
}

export interface ModifyEnchantmentAction extends GameActionBase {
    readonly type: GameActionType.ModifyEnchantment;
    readonly enchantmentId: string;
}

export interface ToggleAttackAction extends GameActionBase {
    readonly type: GameActionType.ToggleAttack;
    readonly unitId: string;
}

export interface DeclareBlockerAction extends GameActionBase {
    readonly type: GameActionType.DeclareBlocker;
    readonly blockerId: string;
    readonly blockedId: string | null;
}

export interface DistributeDamageAction extends GameActionBase {
    readonly type: GameActionType.DistributeDamage;
    readonly attackerID: string;
    readonly order: string[];
}

export interface CardChoiceAction extends GameActionBase {
    readonly type: GameActionType.CardChoice;
    readonly choice: string[];
}

export interface QuitAction extends GameActionBase {
    readonly type: GameActionType.Quit;
}
