import { Card, CardType } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, Mechanic, TargetedMechanic } from '../../mechanic';
import { Unit } from '../../card-types/unit';

export class Sleeping extends Mechanic {
    protected static id = 'Sleeping';
    protected static validCardTypes = new Set([CardType.Unit]);

    constructor(private turns: number = 1) {
        super();
    }
    public enter(card: Card, game: Game) {
        const unit = card as Unit;
        unit.setExhausted(true);
        game.getEvents().startOfTurn.addEvent(this, params => {
            if (params.player === unit.getOwner()) {
                unit.setExhausted(true);
                this.turns--;
                if (this.turns < 1) {
                    unit.removeMechanic(this.getId(), game);
                }
            }
            return params;
        });
    }

    public stack() {
        this.turns++;
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        if (this.turns === 1) {
            return 'Sleeping.';
        } else {
            return `Sleeping (${this.turns}).`;
        }
    }

    public evaluate() {
        return this.turns * -3;
    }
}

export class SleepTarget extends TargetedMechanic {
    protected static id = 'SleepTarget';
    constructor(private turns: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        for (const target of this.targeter.getTargets(card, game, this)) {
            target.addMechanic(new Sleeping(this.turns), game);
        }
    }

    public getText(card: Card) {
        return `Put ${this.targeter.getTextOrPronoun()} to sleep for ${
            this.turns === 1 ? 'a turn' : this.turns + ' turns'
        }.`;
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        return (
            target.evaluate(game, EvalContext.NonlethalRemoval) *
            0.5 *
            (target.getOwner() === source.getOwner() ? -1 : 1)
        );
    }
}
