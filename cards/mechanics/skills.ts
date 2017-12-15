import { Mechanic, EvalContext, EvalOperator } from '../../mechanic';
import { Game, GamePhase } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, CardType } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

abstract class Skill extends Mechanic {
    protected validCardTypes = new Set([CardType.Unit, CardType.Item]);
}

export class Flying extends Skill {
    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.CheckBlockable, params => {
                let blocker = params.get('blocker') as Unit;
                if (!blocker.hasMechanicWithId('flying') && !blocker.hasMechanicWithId('ranged'))
                    params.set('canBlock', false)
                return params;
            }
        ));
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Flying.`;
    }

    public getId() {
        return 'flying';
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.3 }
    }
}

export class Unblockable extends Skill {
    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.CheckBlockable, params => {
                params.set('canBlock', false);
                return params;
            }
        ));
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Unblockable.`;
    }

    public getId() {
        return 'unblockable';
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.75 };
    }
}


export class Rush extends Skill {
    public enter(card: Card, game: Game) {
        (card as Unit).refresh();
    }

    public getText(card: Card) {
        return `Rush.`;
    }

    public getId() {
        return 'rush';
    }

    public evaluate(card: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.Play)
            return { addend: 0, multiplier: 1.2 };
        return 0;
    }
}

export class Aquatic extends Skill {
    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.CheckBlockable, params => {
                let blocker = params.get('blocker') as Unit;
                if (!blocker.hasMechanicWithId('aquatic') && !blocker.hasMechanicWithId('flying'))
                    params.set('canBlock', false)
                return params;
            }
        ));
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.CheckCanBlock, params => {
                let attacker = params.get('attacker') as Unit;
                if (!attacker.hasMechanicWithId('aquatic'))
                    params.set('canBlock', false)
                return params;
            }
        ));
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Aquatic.`;
    }

    public getId() {
        return 'aquatic';
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.1 };
    }
}

export class Ranged extends Skill {
    public enter(card: Card, game: Game) { }


    public getText(card: Card) {
        return `Ranged.`;
    }

    public getId() {
        return 'ranged';
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.1 }
    }
}

export class Lifesteal extends Skill {
    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                game.getPlayer(card.getOwner()).addLife(params.get('amount'));
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Lifesteal.`;
    }

    public getId() {
        return 'lifesteal';
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.3 }
    }
}

export class Lethal extends Skill {
    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                let target = params.get('target') as Unit;
                if (target.getUnitType() !== UnitType.Player)
                    target.kill(true);
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Lethal.`;
    }

    public getId() {
        return 'lethal';
    }

    public evaluate(card: Card) {
        return 3;
    }
}

export class Shielded extends Skill {
    protected validCardTypes = new Set([CardType.Unit, CardType.Item]);
    private depleted = false;
    public enter(card: Card, game: Game) {
        this.depleted = false;
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.TakeDamage, params => {
                if (this.depleted || params.get('amount') === 0)
                    return params;
                params.set('amount', 0);
                this.depleted = true;
                return params;
            },
            0))
    }

    public remove(card: Card, game: Game) {
        this.depleted = false;
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        if (this.depleted)
            return '';
        return `Shielded.`;
    }

    public getId() {
        return 'shielded';
    }

    public isDepleted() {
        return this.depleted;
    }

    public evaluate(card: Card) {
        if (!this.depleted)
            return { addend: 0, multiplier: 1.25 };
        return 0;
    }
}

export class Relentless extends Skill {
    public enter(card: Card, game: Game) {
        game.gameEvents.addEvent(this, new GameEvent(
            EventType.EndOfTurn, params => {
                let target = card as Unit;
                target.refresh();
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Relentless.`;
    }

    public getId() {
        return 'relentless';
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.25 }
    }
}


export class Deathless extends Skill {
    constructor(private charges: number = 1) {
        super();
    }

    public enter(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (eotParams) => {
                this.charges--;
                if (this.charges <= 0)
                    unit.removeMechanic(this.getId(), game);
                game.playFromCrypt(unit);
                game.gameEvents.removeEvents(this);
                return eotParams;
            }))
            return params;
        }));
    }

    public clone() {
        return new Deathless(this.charges);
    }

    public getId() {
        return 'deathless';
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        if (this.charges === 1)
            return 'Deathless.';
        else
            return `Deathless (${this.charges}).`;
    }

    public evaluate(card: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.LethalRemoval)
            return { addend: 0, multiplier: 0.5 };
        return { addend: 0, multiplier: 1.5 };
    }
}

export class Immortal extends Skill {
    public enter(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (eotParams) => {
                game.playFromCrypt(unit);
                return eotParams;
            }))
            return params;
        }));
    }

    public getId() {
        return 'immortal';
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Immortal.`;
    }

    public evaluate(card: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.LethalRemoval)
            return { addend: 0, multiplier: 0.1 };
        return { addend: 0, multiplier: 3 };
    }
}
