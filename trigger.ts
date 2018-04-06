import { Game } from './game';
import { Card, CardType } from './Card';
import { Unit } from './unit';
import { GameEvent, EventType } from './gameEvent';
import { Mechanic, TargetedMechanic, TriggeredMechanic, EvalContext } from './mechanic';

export abstract class Trigger {
    protected static id: string;
    protected mechanic: TriggeredMechanic;
    static getId() {
        return this.id;
    }
    public attach(mechanic: TriggeredMechanic) {
        this.mechanic = mechanic;
    }
    abstract register(card: Card, game: Game): void;
    abstract unregister(card: Card, game: Game): void;
    public isHidden() { return false; }
    abstract getName(): string;
    abstract evaluate(host: Card, game: Game, context: EvalContext): number;
}

