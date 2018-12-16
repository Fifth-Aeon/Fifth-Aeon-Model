export enum GameActionType {
    PlayResource, PlayCard, Pass, ModifyEnchantment,
    ToggleAttack, DeclareBlocker, DistributeDamage, CardChoice, Quit
}

interface GameActionBase {
    readonly type: GameActionType;
    readonly player: number;
}

export type GameAction = PlayResourceAction | PlayCardAction | PassAction | ModifyEnchantmentAction |
    ToggleAttackAction | DeclareBlockerAction | DistributeDamageAction | CardChoiceAction | QuitAction;

interface PlayResourceAction extends GameActionBase {
    readonly type: GameActionType.PlayResource;
    readonly resourceType: string;
}

interface PlayCardAction extends GameActionBase {
    readonly type: GameActionType.PlayCard;
    readonly id: string;
    readonly targetIds: string[];
    readonly hostId?: string;
}

interface PassAction extends GameActionBase {
    readonly type: GameActionType.Pass;
}

interface ModifyEnchantmentAction extends GameActionBase {
    readonly type: GameActionType.ModifyEnchantment;
    readonly enchantmentId: string;
}

interface ToggleAttackAction extends GameActionBase {
    readonly type: GameActionType.ToggleAttack;
    readonly unitId: string;
}

interface DeclareBlockerAction extends GameActionBase {
    readonly type: GameActionType.DeclareBlocker;
    readonly blockerId: string;
    readonly blockedId: string;
}

interface DistributeDamageAction extends GameActionBase {
    readonly type: GameActionType.DistributeDamage;
    readonly attackerID: string;
    readonly order: string[];
}

interface CardChoiceAction extends GameActionBase {
    readonly type: GameActionType.CardChoice;
    readonly choice: string[];
}

interface QuitAction extends GameActionBase {
    readonly type: GameActionType.Quit;
}
