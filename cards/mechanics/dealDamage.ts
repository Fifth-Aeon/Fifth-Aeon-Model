import { Card, CardType, GameZone } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, Mechanic, UnitTargetedMechanic, EvalMap, maybeEvaluate } from '../../mechanic';
import { ResourceType } from '../../resource';
import { Unit } from '../../card-types/unit';
import { ParameterType } from '../parameters';

export class DamageOnBlock extends Mechanic {
    protected static id = 'DamageOnBlock';
    protected static validCardTypes = new Set([CardType.Unit, CardType.Item]);
    protected static ParameterTypes = [
        { name: 'damage', type: ParameterType.Integer }
    ];

    constructor(protected damage: number = 1) {
        super();
    }

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().block.addEvent(this, params => {
            const attacker = params.attacker;
            attacker.takeDamage(this.damage, card);
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public evaluate(card: Card) {
        return this.damage * 2;
    }

    public getText(card: Card, game: Game) {
        return `Whenever this blocks another unit deal ${
            this.damage
        } damage to that unit (before combat damage).`;
    }
}

export class DealDamage extends UnitTargetedMechanic {
    protected static id = 'DealDamage';
    protected static ParameterTypes = [
        { name: 'damage', type: ParameterType.Integer }
    ];

    constructor(protected amount: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        const dmg = this.getDamage(card, game);
        for (const target of this.targeter.getUnitTargets(card, game, this)) {
            card.dealDamageInstant(target, dmg);
            target.checkDeath();
        }
    }

    public getDamage(card: Card, game: Game) {
        return this.amount;
    }

    public getText(card: Card, game: Game) {
        return `Deal ${
            this.amount
        } damage to ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateUnitTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap) {
        const isEnemy = target.getOwner() === source.getOwner() ? -1 : 1;
        return target.getLife() < this.getDamage(source, game)
            ? maybeEvaluate(game, EvalContext.LethalRemoval, target, evaluated) * isEnemy
            : 0;
    }
}

export class BiteDamage extends DealDamage {
    protected static id = 'BiteDamage';

    constructor() {
        super(0);
    }

    public getDamage(card: Card, game: Game) {
        return Math.max(
            Math.max(
                ...game
                    .getBoard()
                    .getPlayerUnits(card.getOwner())
                    .map(unit => unit.getDamage())
            ),
            0
        );
    }

    public getText(card: Card, game: Game) {
        if (game) {
            return `Deal damage to target unit equal to your highest attack unit [dynamic](${this.getDamage(
                card,
                game
            )})[/dynamic].`;
        } else {
            return `Deal damage to target unit equal to your highest attack unit.`;
        }
    }
}

export class DamageSpawnOnKill extends DealDamage {
    protected static id = 'DamageSpawnOnKill';
    protected static ParameterTypes = [
        { name: 'damage', type: ParameterType.Integer },
        { name: 'unit', type: ParameterType.Unit }
    ];

    private name: string;
    constructor(amount: number = 1, private factory: () => Unit) {
        super(amount);
        this.name = factory().getName();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getUnitTargets(card, game, this)) {
            target.takeDamage(this.amount, card);
            target.checkDeath();
            if (target.getLocation() === GameZone.Crypt) {
                game.playGeneratedUnit(card.getOwner(), this.factory());
            }
        }
    }

    public getText(card: Card) {
        return `Deal ${
            this.amount
        } damage to ${this.targeter.getTextOrPronoun()}. If it dies summon a ${
            this.name
        }.`;
    }
}

export class DealResourceDamage extends DealDamage {
    protected static id = 'DealResourceDamage';
    protected static ParameterTypes = [
        { name: 'Resource', type: ParameterType.ResourceType }
    ];

    constructor(private resource = ResourceType.Synthesis) {
        super(0);
    }
    public getDamage(card: Card, game: Game) {
        return game
            .getPlayer(card.getOwner())
            .getPool()
            .getOfType(this.resource);
    }

    public getText(card: Card, game: Game) {
        if (game) {
            return `Deal damage to ${this.targeter.getTextOrPronoun()} equal to your ${
                this.resource
            } [dynamic](${this.getDamage(card, game)})[/dynamic].`;
        } else {
            return `Deal damage to ${this.targeter.getTextOrPronoun()} equal to your ${
                this.resource
            }.`;
        }
    }
}
