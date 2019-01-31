import { ClientGame } from './clientGame';
import {
    GameAction, GameActionType, PlayCardAction, ToggleAttackAction, DeclareBlockerAction, ModifyEnchantmentAction
} from './events/gameAction';
import { Unit } from './card-types/unit';
import { Enchantment } from './card-types/enchantment';
import { GamePhase } from './game';
import { Player } from './player';
import { Card } from './card-types/card';
import { Item } from './card-types/item';

export class ClientInterface {
    private owningPlayer: Player;

    constructor(
        private game: ClientGame,
        private owningPlayerNo: number
    ) {
        this.owningPlayer = game.getPlayer(owningPlayerNo);
    }


    /**
     * Attempts take an action as the controlling player. This will fail if the action is not legal.
     *
     * @param action - The action to take
     *
     * @returns True if the action was valid, false if it was an illegal action
     */
    public takeAction(action: GameAction): boolean {
        switch (action.type) {
            case GameActionType.PlayCard:
                return this.game.playCardExtern(
                    this.game.getCardById(action.id),
                    action.targetIds.map(id => this.getUnitById(id)) as Unit[],
                    action.hostId ? this.getUnitById(action.hostId) as Unit : null
                );
            case GameActionType.ToggleAttack:
                return this.game.declareAttacker(this.getUnitById(action.unitId));
            case GameActionType.DeclareBlocker:
                return this.game.declareBlocker(
                    this.getUnitById(action.blockerId),
                    action.blockedId ? this.getUnitById(action.blockedId) : null
                );
            case GameActionType.CardChoice:
                return this.game.makeChoice(action.player, action.choice.map(id => this.game.getCardById(id)));
            case GameActionType.ModifyEnchantment:
                return this.game.modifyEnchantment(
                    this.game.getPlayer(action.player),
                    this.getEnchantmentById(action.enchantmentId)
                );
            case GameActionType.DistributeDamage:
                return this.game.setAttackOrder(this.getUnitById(action.attackerID), action.order.map(id => this.getUnitById(id)));
            case GameActionType.Pass:
                return this.game.pass();
            case GameActionType.PlayResource:
                return this.game.playResource(action.resourceType);
        }
        return false;

    }

    public getAvalibleActions(): GameAction[] {
        const allActions: GameAction[] = [];
        return allActions
            .concat(this.getPlayCardActions())
            .concat(this.getAttackActions())
            .concat(this.getBlockActions())
            .concat(this.getEnchantmentActions());
    }

    getEnchantmentActions(): ModifyEnchantmentAction[] {
        const modifiableEnchantments = this.game
            .getBoard()
            .getAllEnchantments()
            .filter(enchant => this.game.canModifyEnchantment(enchant));

        return modifiableEnchantments.map(enchant => {
            return {
                type: GameActionType.ModifyEnchantment,
                enchantmentId: enchant.getId(),
                player: this.owningPlayerNo
            } as ModifyEnchantmentAction;
        });
    }

    /**
     * Enumerates all currently legal play card actions.
     * This includes all possible targets for all cards that the player can legally play.
     * */
    public getPlayCardActions(): PlayCardAction[] {
        if (this.game.getActivePlayer() !== this.owningPlayerNo || this.game.getPhase() === GamePhase.Block) {
            return [];
        }
        const playableCards = this.owningPlayer
            .getHand()
            .filter(card => card.isPlayable(this.game));
        const actions: PlayCardAction[] = [];

        for (const card of playableCards) {
            const playCardVarients = this.getPlayCardVarients(card);
            for (const varient of playCardVarients) {
                actions.push(varient);
            }
        }
        return actions;
    }

    public getAttackActions(): ToggleAttackAction[] {
        if (this.game.getActivePlayer() !== this.owningPlayerNo || this.game.getPhase() !== GamePhase.Play1) {
            return [];
        }
        const potentialAttackers = this.game
            .getBoard()
            .getPlayerUnits(this.owningPlayerNo)
            .filter(unit => unit.canAttack());
        return potentialAttackers.map(attacker => {
            return {
                player: this.owningPlayerNo,
                type: GameActionType.ToggleAttack,
                unitId: attacker.getId()
            } as ToggleAttackAction;
        });
    }

    public getBlockActions(): DeclareBlockerAction[] {
        if (this.game.getActivePlayer() !== this.owningPlayerNo || this.game.getPhase() !== GamePhase.Block) {
            return [];
        }
        const potentialBlockers = this.game
            .getBoard()
            .getPlayerUnits(this.owningPlayerNo)
            .filter(unit => !unit.isExhausted());
        const attackers = this.game.getAttackers();
        const blockActions: DeclareBlockerAction[] = [];
        for (const blocker of potentialBlockers) {
            for (const attacker of attackers) {
                if (blocker.canBlockTarget(attacker)) {
                    blockActions.push({
                        type: GameActionType.DeclareBlocker,
                        blockerId: blocker.getId(),
                        blockedId: attacker.getId(),
                        player: this.owningPlayerNo
                    });
                }
            }
        }
        return blockActions;
    }

    /** Enumerates all the valid targets and hosts for a given card */
    private getPlayCardVarients(card: Card): PlayCardAction[] {
        const varients: PlayCardAction[] = [];
        const targets = card.getTargeter().getValidTargets(card, this.game);
        const hosts = card instanceof Item ? card.getHostTargeter().getValidTargets(card, this.game) : [undefined];

        for (const host of hosts) {
            if (card.getTargeter().needsInput()) {
                for (const target of targets) {
                    varients.push({
                        id: card.getId(),
                        player: this.owningPlayerNo,
                        type: GameActionType.PlayCard,
                        targetIds: [target.getId()],
                        hostId: host ? host.getId() : undefined
                    });
                }
            } else {
                varients.push({
                    id: card.getId(),
                    player: this.owningPlayerNo,
                    type: GameActionType.PlayCard,
                    targetIds: targets.map(target => target.getId()),
                    hostId: host ? host.getId() : undefined
                });
            }
        }

        return varients;
    }


    private getUnitById(id: string): Unit {
        const card = this.game.getCardById(id);
        if (card instanceof Unit) {
            return card;
        }
        throw new Error(`${id} is not the id of a unit.`);
    }

    private getEnchantmentById(id: string): Enchantment {
        const card = this.game.getCardById(id);
        if (card instanceof Enchantment) {
            return card;
        }
        throw new Error(`${id} is not the id of an enchantment.`);
    }
}
