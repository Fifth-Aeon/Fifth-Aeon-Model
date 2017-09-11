import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';



export class Sleeping extends Mechanic {
    constructor(private turns: number = 1) {
        super();
    }
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.setExausted(true);
        game.gameEvents.addEvent(this, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == unit.getOwner()) {
                unit.setExausted(true);
                this.turns--;
                if (this.turns < 1) {
                    unit.removeMechanic(this.id(), game);
                }
            }
            return params;
        }));
    }

    public stack() {
        this.turns++;
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public id() {
        return 'sleeping';
    }

    public getText(card: Card) {
        if (this.turns == 1)
            return 'Sleeping.';
        else 
            return `Sleeping (${this.turns}).`;
    }

    public evaluate() {
        return this.turns * -3;
    }
}

export class SleepTarget extends TargetedMechanic {
    constructor(private turns:number) {
        super();
    }

    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.addMechanic(new Sleeping(this.turns), game);
        }
    }

    public getText(card: Card) {
        return `Put ${this.targeter.getText()} to sleep for ${this.turns == 1 ? 'a turn' : this.turns + ' turns'}.`
    }

    public evaluateTarget(source: Card, target: Unit, game:Game) {
        return target.evaluate(game) * 0.5 * (target.getOwner() == source.getOwner() ? -1 : 1);
    }
}
