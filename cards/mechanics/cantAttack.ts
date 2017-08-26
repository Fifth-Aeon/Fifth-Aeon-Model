import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game, GamePhase } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class CannotAttack extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).setAttackDisabled(true);
    }

    public remove(card: Card, game: Game) {
        (card as Unit).setAttackDisabled(false);
    }

    public getText(card: Card) {
        return `Cannot attack.`;
    }
}

export class CannotBlock extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).setBlockDisabled(true);
    }

    public remove(card: Card, game: Game) {
        (card as Unit).setBlockDisabled(false);
    }

    public getText(card: Card) {
        return `Cannot block.`;
    }
}

export class ImprisonTarget extends TargetedMechanic {
    public run(card: Card, game: Game) {
        this.targeter.getTargets(card, game).forEach(target => {
            target.addMechanic(new CannotAttack(), game);
            target.addMechanic(new CannotBlock(), game);
        });
    }

    public getText(card: Card) {
        return `Cause ${this.targeter.getText()} to become unable to attack or block.`;        
    }

    public evaluateTarget(owner: number, unit: Unit) {
        return unit.evaluate() * 1.25 * (unit.getOwner() == owner ? -1 : 1);
    }
}