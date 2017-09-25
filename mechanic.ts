import { Game } from './game';
import { Card, Location } from './card';
import { Unit } from './unit';
import { Targeter } from './targeter';

import { sumBy } from 'lodash';

export abstract class Mechanic {
    public attach(parent: Card) { };
    abstract run(parent: Card, game: Game): void;
    abstract getText(parent: Card, game: Game): string;
    public remove(card: Card, game: Game) { };
    public id(): string { return null };
    abstract evaluate(card: Card, game: Game);
    public evaluateTarget(source: Card, target: Unit, game: Game) { return 0; }
    public stack() { }
}

export abstract class TargetedMechanic extends Mechanic {
    constructor(protected targeter?: Targeter) {
        super();
    }

    public attach(parent: Card) {
        this.targeter = this.targeter || parent.getTargeter();
    }

    public evaluate(card: Card, game: Game) {
        if (card.getLocation() == Location.Hand)
            return sumBy(this.targeter.getTargets(card, game),
                (target) => this.evaluateTarget(card, target, game));
        return 0;
    }

}