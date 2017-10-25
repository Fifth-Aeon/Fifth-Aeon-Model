import { Game } from './game';
import { Card, CardType, Location } from './card';
import { Unit } from './unit';
import { Targeter } from './targeter';

import { sumBy } from 'lodash';

export enum EvalContext {
    LethalRemoval, NonlethalRemoval, Play
}
 
export abstract class Mechanic {
    public attach(parent: Card) {
        if (!this.canAttach(parent))
            throw new Error(`Cannot attach  mechanic ${this.id()} to ${parent.getName()} it is not of the right card type.`);
    };
    abstract run(parent: Card, game: Game): void;
    abstract getText(parent: Card, game: Game): string;
    public remove(card: Card, game: Game) { };
    public id(): string {
        return this.constructor.name;
    };
    abstract evaluate(card: Card, game: Game, context:EvalContext): number;
    public evaluateTarget(source: Card, target: Unit, game: Game) { return 0; }
    public stack() { }
    public clone(): Mechanic { return this; } 

    protected validCardTypes = new Set([CardType.Spell, CardType.Enchantment, CardType.Unit, CardType.Item]);
    public canAttach(card: Card) {
        return this.validCardTypes.has(card.getCardType());
    }
}

export abstract class TargetedMechanic extends Mechanic {
    constructor(protected targeter?: Targeter) {
        super();
    }

    public attach(parent: Card) {
        super.attach(parent); 
        this.targeter = this.targeter || parent.getTargeter();
    }

    public evaluate(card: Card, game: Game) {
        if (card.getLocation() == Location.Hand)
            return sumBy(this.targeter.getTargets(card, game),
                (target) => this.evaluateTarget(card, target, game));
        return 0;
    }

}