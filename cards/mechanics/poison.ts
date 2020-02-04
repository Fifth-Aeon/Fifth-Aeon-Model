import { Card } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, Mechanic, TargetedMechanic, EvalMap, maybeEvaluate } from '../../mechanic';
import { Permanent } from '../../card-types/permanent';
import { Unit, UnitType } from '../../card-types/unit';

export class Poisoned extends Mechanic {
    protected static id = 'Poisoned';
    protected static validCardTypes = Permanent.cardTypes;

    private level = 1;
    public enter(card: Card, game: Game) {
        const unit = card as Unit;
        game.getEvents().startOfTurn.addEvent(this, params => {
            if (params.player === unit.getOwner()) {
                unit.buff(-this.level, -this.level);
            }
        });
    }

    public stack() {
        this.level++;
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        if (this.level === 1) {
            return 'Poisoned.';
        } else {
            return `Poisoned (${this.level}).`;
        }
    }

    public evaluate(card: Card) {
        return (card as Unit).getStats() * -0.75;
    }
}

export class PoisonTarget extends TargetedMechanic {
    protected static id = 'PoisonTarget';

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.addMechanic(new Poisoned(), game);
        }
    }

    public getText(card: Card) {
        return `Poison ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap) {
        if (target.isImmune(Poisoned.getId())) {
            return 0;
        }
        return (
            maybeEvaluate(game, EvalContext.NonlethalRemoval, target, evaluated) *
            0.5 *
            (target.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}

export class CurePoison extends TargetedMechanic {
    protected static id = 'CurePoison';
    public onTrigger(card: Card, game: Game) {
        this.targeter.getTargets(card, game, this).forEach(target => {
            target.removeMechanic(Poisoned.getId(), game);
        });
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Cure ${this.targeter.getTextOrPronoun()}.`;
    }

    public evaluateTarget(source: Card, target: Unit, game: Game, evaluated: EvalMap) {
        const allyFactor = target.getOwner() === source.getOwner() ? 1 : -1;
        const cureFactor = target.hasMechanicWithId(Poisoned.getId()) ? 0 : .7;
        return allyFactor * cureFactor * maybeEvaluate(game, EvalContext.NonlethalRemoval, target, evaluated);
    }
}

export class Venomous extends Mechanic {
    protected static id = 'Venomous';
    protected static validCardTypes = Permanent.cardTypes;

    public enter(card: Card, game: Game) {
        const unit = card as Unit;
        unit.getEvents().dealDamage.addEvent(this, params => {
            const target = params.target;
            if (target.getUnitType() !== UnitType.Player) {
                target.addMechanic(new Poisoned(), game);
            }
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return 'Venomous.';
    }

    public evaluate() {
        return 3;
    }
}

export class PoisonImmune extends Mechanic {
    protected static id = 'PoisonImmune';
    protected static validCardTypes = Permanent.cardTypes;

    public enter(card: Card, game: Game) {
        (card as Unit).addImmunity('poisoned');
    }

    public remove(card: Card, game: Game) {
        (card as Unit).removeImmunity('poisoned');
    }

    public getText(card: Card) {
        return `Immune to poison.`;
    }

    public evaluate() {
        return 0.5;
    }
}
