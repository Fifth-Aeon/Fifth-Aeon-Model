import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game, GamePhase } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

import { Sleeping } from './sleep';
import { Poisoned } from './poison';


const robotImmunities = [new Sleeping().id(), new Poisoned().id()];
export class Robotic extends Mechanic {
    public run(card: Card, game: Game) {
        for (let immunity of robotImmunities) {
            (card as Unit).addImmunity(immunity);
        }
    }  
    public remove(card: Card, game: Game) {
        for (let immunity of robotImmunities) {
            (card as Unit).removeImmunity(immunity);
        }
    }

    public id() {
        return 'robotic';
    }

    public getText(card: Card) {
        return `Robotic.`;
    }

    public evaluate() {
        return 1;
    }
}
export class SpyPower extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                let target = params.get('target') as Unit;
                if (target.getType() == UnitType.Player)
                    game.getPlayer(card.getOwner()).drawCard();
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return 'Whenever this damages your opponent draw a card.';
    }
}


export class DealSynthDamage extends TargetedMechanic {
    public run(card: Card, game: Game) {
        let amount = game.getPlayer(card.getOwner()).getPool().getOfType('Synthesis');
        for (let target of this.targeter.getTargets(card, game)) {
            target.takeDamage(amount);
            target.checkDeath();
        }
    }

    public getText(card: Card) {
        return `Deal damage to ${this.targeter.getText()} equal to your synthesis.`
    }
}
