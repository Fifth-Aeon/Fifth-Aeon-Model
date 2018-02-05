import { Mechanic, EvalContext, TriggeredMechanic } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { Enchantment } from '../../enchantment';
import { a } from '../../strings';

export class SummonUnits extends TriggeredMechanic {
    protected id = 'SummonUnits';
    protected name: string;
    protected unit: Unit;
    constructor(protected factory: () => Unit, protected count: number = 1) {
        super();
        this.unit = factory();
        this.name = factory().getName();
    }

    public onTrigger(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        for (let i = 0; i < this.getUnitCount(card, game); i++) {
            game.playGeneratedUnit(owner, this.factory())
        }
    }

    public getUnitCount(card: Card, game: Game) {
        return this.count;
    }

    public getText(card: Card, game: Game) {
        return `Summon ${this.count === 1 ? a(this.name) : this.count} ${this.name}.`;
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
            .filter(cryptCard => cryptCard.isUnit()).length / this.factor);
    }

    public getText(card: Card, game: Game) {
        if (game)
            return `Play ${a(this.name)} ${this.name} for each ${this.factor} units in any crypt (${this.getUnitCount(card, game)}).`;
        else
            return `Play ${a(this.name)} ${this.name} for each ${this.factor} units in any crypt (rounded down).`;
    }
}

export class EnchantmentSummon extends SummonUnits {
    protected id = 'EnchantmentSummon';

    public onTrigger(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let enchant = card as Enchantment;
        for (let i = 0; i < this.getUnitCount(card, game); i++) {
            let summoned = game.playGeneratedUnit(owner, this.factory());
            summoned.setStats(enchant.getPower(), enchant.getPower());
        }
    }

    public getText(card: Card, game: Game) {
        return `Summon ${this.count === 1 ? 'a' : this.count} ${this.name}. It becomes an X/X where X is this enchantment’s power.`;
    }

    public evaluate(card: Card, game: Game) {
        return this.unit.evaluate(game, EvalContext.Play) * Math.min(this.getUnitCount(card, game),
            game.getBoard().getRemainingSpace(card.getOwner()));
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

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                let target = params.get('target') as Unit;
                if (target.getUnitType() === UnitType.Player) {
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

    public evaluate(card: Card, game: Game) {
        // TODO something cleverer
        // Look at hether opponetn can Block?
        return this.unit.evaluate(game, EvalContext.Play);
    }
}
