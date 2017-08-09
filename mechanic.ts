import { Game } from './game';
import { Card } from './card';
import { Targeter } from './targeter';

export abstract class Mechanic {
    public attach(parent:Card) {};
    abstract run(parent: Card, game: Game): void;
    abstract getText(parent: Card): string;
    public remove(card: Card, game: Game) { };
    public id() { return '' };
}


export abstract class TargetedMechanic extends Mechanic {
    constructor(protected targeter?:Targeter) {
        super()
    }
    public attach(parent:Card) {
        this.targeter = this.targeter || parent.getTargeter();
    };
    abstract run(parent: Card, game: Game): void;
    abstract getText(parent: Card): string;
    public remove(card: Card, game: Game) { };
    public id() { return '' };
}