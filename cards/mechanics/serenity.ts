import { Mechanic } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Serenity extends Mechanic {
    constructor(private effectText: string, private value: number, private effect: (unit: Unit, game: Game) => void) {
        super();
    }

    public run(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (params) => {
            if (game.getCurrentPlayer().getPlayerNumber() === card.getOwner() &&
                game.getPhase() === GamePhase.Play1) {
                this.effect(card as Unit, game);
            }
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Serenity: ${this.effectText}.`;
    }

    public evaluate() {
        return this.value;
    }
}
