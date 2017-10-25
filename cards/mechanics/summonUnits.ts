import { Mechanic, EvalContext } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
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

    public getUnitCount(card: Card, game: Game) {
        return this.count;
    }

    public getText(card: Card, game: Game) {
        return `Summon ${this.count} ${this.name}.`;
    }

    public evaluate(card: Card, game: Game) {
        return this.unit.evaluate(game, EvalContext.Play) * Math.min(this.getUnitCount(card, game),
            game.getBoard().getRemainingSpace(card.getOwner()));
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

export class SummonUnitOnDamage extends Mechanic {
    protected name: string;
    protected unit: Unit;

    constructor(protected factory: () => Unit) {
        super();

        this.unit = factory();
        this.name = this.unit.getName();
    }

    public run(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                let target = params.get('target') as Unit;
                if (target.getUnitType() == UnitType.Player) {
                    let owner = game.getPlayer(card.getOwner());
                    game.playGeneratedUnit(owner, this.factory())
                }
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Whenever this damages your opponent summon a ${this.name}.`;
    }

    public evaluate(card:Card, game:Game) {
        // TODO something cleverer
        // Look at hether opponetn can Block?
        return this.unit.evaluate(game, EvalContext.Play);
    }
}