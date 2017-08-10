import { TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Annihilate extends TargetedMechanic {
    public run(card: Card, game: Game) {
        this.targeter.getTargets(card, game).forEach(target => {
            target.annihilate();
        });
    }

    public getText(card: Card) {
        return `Annihilate ${this.targeter.getText()}.`;
    }
}

export class KillTarget extends TargetedMechanic {
     public run(card: Card, game: Game) {
        this.targeter.getTargets(card, game).forEach(target => {
            target.kill();
        });
    }

    public getText(card: Card) {
        return `Kill ${this.targeter.getText()}.`;
    }
}

