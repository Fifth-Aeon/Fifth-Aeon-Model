import { Mechanic } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class SummonUnits extends Mechanic {
    private name;
    constructor(private factory: () => Unit, private count: number = 1) {
        super();
        this.name = factory().getName();
    }

    public run(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        for (let i = 0; i < this.count; i++) {
            game.playGeneratedUnit(owner, this.factory())
        }
    }

    public getText(card: Card) {
        return `Summon ${this.count} ${this.name}.`;
    }
}
