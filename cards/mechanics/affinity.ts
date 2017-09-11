import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Affinity extends Mechanic {
    constructor(private effectText: string, private value:number, private effect: (unit: Unit, game: Game) => void) {
        super();
    }

    private triggered:boolean = false;

    public run(card: Card, game: Game) {
        let mutatingUnit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.UnitEntersPlay, (params) => {
            let enteringUnit = params.get('enteringUnit') as Unit;
            if (enteringUnit != mutatingUnit &&
                enteringUnit.getOwner() == mutatingUnit.getOwner() &&
                enteringUnit.getType() == mutatingUnit.getType()) {
                this.effect(mutatingUnit, game);
                game.gameEvents.removeEvents(this);
                this.triggered = true;
            }
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        if (this.triggered)
            return '';
        return `Affinity: ${this.effectText}.`;
    }

    public evaluate() {
        if (this.triggered)
            return 0;
        return this.value;
    }
}
