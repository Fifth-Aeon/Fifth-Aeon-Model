import { Mechanic } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class SummonUnits extends Mechanic {
    protected name: string;
    protected unit: Unit;
    constructor(protected factory: () => Unit, private count: number = 1) {
        super();
        this.unit = factory();
        this.name = factory().getName();
    }

    public run(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        for (let i = 0; i < this.getUnitCount(card, game); i++) {
            game.playGeneratedUnit(owner, this.factory())
        }
    }

    public getUnitCount(card: Card, game: Game)  {
        return this.count;
    }

    public getText(card: Card, game: Game) {
        return `Summon ${this.count} ${this.name}.`;
    }

    public evaluate(card: Card, game: Game) {
        return this.unit.evaluate(game) * this.getUnitCount(card, game);
    }
}


export class SummonUnitForGrave extends SummonUnits {
    constructor(factory: () => Unit, private factor: number) {
        super(factory, 0);
    }

    public getUnitCount(card: Card, game: Game) {
        return Math.floor(game.getCrypt(0)
            .concat(game.getCrypt(1))
            .filter(card => card.isUnit()).length / this.factor);
    }

    public getText(card: Card, game: Game) {
        if (game)
            return `Play a ${this.name} for each ${this.factor} units in any crypt (${this.getUnitCount(card, game)}).`;
        else
            return `Play a ${this.name} for each ${this.factor} units in any crypt (rounded down).`;
    }
}
