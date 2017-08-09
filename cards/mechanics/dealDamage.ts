import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';

export class DealDamage extends TargetedMechanic {
    constructor(private amount: number, targeter?: Targeter) {
        super(targeter); 
    }

    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.takeDamage(this.amount);
            target.checkDeath();
        }
    }

    public getText(card: Card) {
        return `Deal ${this.amount} damage to ${this.targeter.getText()}.`
    }
}
