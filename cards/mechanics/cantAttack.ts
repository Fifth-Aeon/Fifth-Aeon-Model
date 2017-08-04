import { Mechanic } from '../../mechanic';
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
        (card as Unit).setAttackDisabled(true);
    }

    public remove(card: Card, game: Game) {
        (card as Unit).setAttackDisabled(false);
    }

    public getText(card: Card) {
        return `Cannot block.`;
    }
}

