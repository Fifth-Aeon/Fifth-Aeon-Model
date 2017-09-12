import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, Location } from '../../card';
import { Unit } from '../../unit';

export class DealDamage extends TargetedMechanic {
    constructor(protected amount: number, targeter?: Targeter) {
        super(targeter);
    }

    public run(card: Card, game: Game) {
        let dmg = this.getDamage(card, game);
        for (let target of this.targeter.getTargets(card, game)) {
            target.takeDamage(dmg);
            target.checkDeath();
        }
    }

    public getDamage(card: Card, game: Game) {
        return this.amount;
    }

    public getText(card: Card, game: Game) {
        return `Deal ${this.amount} damage to ${this.targeter.getText()}.`
    }

    public evaluateTarget(source: Card, target: Unit, game: Game) {
        let isEnemy = target.getOwner() == source.getOwner() ? -1 : 1;
        return target.getLife() < this.getDamage(source, game) ? target.evaluate(game) * isEnemy : 0;
    }
}

export class BiteDamage extends DealDamage {
    constructor() {
        super(0);
    }

    public getDamage(card: Card, game: Game) {
        return Math.max(Math.max(...game.getBoard().getPlayerUnits(card.getOwner()).map(unit => unit.getDamage())), 0);;
    }

    public getText(card: Card, game: Game) {
        if (game) 
            return `Deal damage to target unit equal to your highest attack unit (${this.getDamage(card, game)}).`;
        else
            return `Deal damage to target unit equal to your highest attack unit.`;
            
    }
}

export class DamageSpawnOnKill extends DealDamage {
    private name: string;
    constructor(amount: number, private factory: () => Unit) {
        super(amount);
        this.name = factory().getName();
    }

    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.takeDamage(this.amount);
            target.checkDeath();
            if (target.getLocation() == Location.Crypt) {
                game.playGeneratedUnit(card.getOwner(), this.factory());
            }
        }
    }

    public getText(card: Card) {
        return `Deal ${this.amount} damage to ${this.targeter.getText()}. If it dies play a ${this.name}.`
    }
}


export class DealSynthDamage extends DealDamage {
    constructor() {
        super(0);
    }
    public getDamage(card: Card, game: Game) {
        return game.getPlayer(card.getOwner()).getPool().getOfType('Synthesis')
    }

    public getText(card: Card, game: Game) {
        if (game)
            return `Deal damage to ${this.targeter.getText()} equal to your synthesis (${this.getDamage(card, game)}).`
        else
            return `Deal damage to ${this.targeter.getText()} equal to your synthesis.`
    }
}
