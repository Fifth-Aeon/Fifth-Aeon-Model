import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, Location } from '../../card';
import { Unit, UnitType } from '../../unit';
import { Resource } from '../../resource';
import { GameEvent, EventType } from '../../gameEvent';

import { remove } from 'lodash';

export class DrawCardsFromUnit extends TargetedMechanic {
    constructor(private factor: number) {
        super();
    }

    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            let num = Math.floor((target.getMaxLife() + target.getDamage()) / this.factor);
            game.getPlayer(card.getOwner()).drawCards(num);
        }
    }

    public getText(card: Card) {
        return `Choose a friendly unit. Draw cards equal to its stats divided by ${this.factor}.`
    }
}

export class BiteDamage extends TargetedMechanic {
    public run(card: Card, game: Game) {
        let dmg = Math.max(Math.max(...game.getBoard().getPlayerUnits(card.getOwner()).map(unit => unit.getDamage())), 0);
        for (let target of this.targeter.getTargets(card, game)) {
            target.takeDamage(dmg);
            target.checkDeath();
        }
    }

    public getText(card: Card) {
        return `Deal damage to target unit equal to your highest attack unit.`;
    }
}

export class WebTarget extends TargetedMechanic {
    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.removeMechanic('flying', game);
            target.setExausted(true);
        }
    }

    public getText(card: Card) {
        return `Exaust ${this.targeter.getText()}. It loses flying.`
    }
}


