import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';

export class DealDamage extends Mechanic {
    constructor(private amount: number, private targeter: Targeter) {
        super();
    }

    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(game)) {
            target.takeDamage(this.amount);
        }
    }

    public getText(card: Card) {
        return `Deal ${this.amount} damage to ${this.targeter.getText()}.`
    }
}
