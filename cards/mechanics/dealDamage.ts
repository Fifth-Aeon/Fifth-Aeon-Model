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

    public getDamage(card: Card, game:Game) {
        return this.amount;
    }

    public getText(card: Card) {
        return `Deal ${this.amount} damage to ${this.targeter.getText()}.`
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        let isEnemy = target.getOwner() == source.getOwner() ? -1 : 1;
        return target.getLife() < this.getDamage(source, game) ? target.evaluate(game) * isEnemy : 0;
    }
}

export class BiteDamage extends DealDamage {
    constructor () {
        super(0);
    }

    public getDamage(card: Card, game:Game) {
        return Math.max(Math.max(...game.getBoard().getPlayerUnits(card.getOwner()).map(unit => unit.getDamage())), 0);;
    }

    public getText(card: Card) {
        return `Deal damage to target unit equal to your highest attack unit.`;
    }
}
