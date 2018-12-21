import { Card } from './card';
import { Game } from './game';
import { EvalContext, TriggeredMechanic } from './mechanic';

export abstract class Trigger {
    protected static id: string;
    protected mechanic?: TriggeredMechanic;
    static getId() {
        return this.id;
    }
    public getId(): string {
        return (this.constructor as any).id;
    }
    public attach(mechanic: TriggeredMechanic) {
        this.mechanic = mechanic;
    }
    abstract register(card: Card, game: Game): void;
    abstract unregister(card: Card, game: Game): void;
    public isHidden() {
        return false;
    }
    abstract getText(mechanicText: string): string;
    abstract evaluate(host: Card, game: Game, context: EvalContext): number;
}
