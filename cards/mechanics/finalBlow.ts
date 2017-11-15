import { Mechanic } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class FinalBlow extends Mechanic {
    constructor(private effectText: string, private value: number, private effect: (unit: Unit, killid: Unit, game: Game) => void) {
        super();
    }

    public enter(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.KillUnit, (params) => {
            this.effect(card as Unit, params.get('target'), game);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Final Blow: ${this.effectText}.`;
    }

    public evaluate() {
        return this.value;
    }
}
