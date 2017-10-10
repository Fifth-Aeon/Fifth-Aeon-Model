import { Mechanic } from '../../mechanic';
import { Game, GamePhase } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

export class Flying extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.CheckBlock, params => {
                let blocker = params.get('blocker') as Unit;
                if (!blocker.hasMechanicWithId('flying'))
                    params.set('canBlock', false)
                return params;
            }
        ))
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Flying.`;
    }

    public id() {
        return 'flying';
    }

    public evaluate(card:Card) {
        let unit = card as Unit;
        return unit.getDamage() * 0.75 + unit.getLife() * 0.25;
    }
}

export class Lifesteal extends Mechanic {
    public run(card: Card, game: Game) {
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

    public id() {
        return 'lifesteal';
    }

    public evaluate(card: Card) {
        let unit = card as Unit;
        return unit.getDamage() * 0.4;
    }
}

export class Lethal extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                let target = params.get('target') as Unit;
                if (target.getUnitType() != UnitType.Player)
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

    public id() {
        return 'lethal';
    }

    public evaluate(card: Card) {
        return 3;
    }

}

export class Shielded extends Mechanic {
    private depleted: boolean = false;
    public run(card: Card, game: Game) {
        this.depleted = false;
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.TakeDamage, params => {
                if (this.depleted || params.get('amount') == 0)
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

    public id() {
        return 'shielded';
    }

    public evaluate(card: Card) {
        return 3;
    }
}

export class Relentless extends Mechanic {
    public run(card: Card, game: Game) {
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

    public id() {
        return 'relentless';
    }

    public evaluate(card: Card) {
        return 3;
    }
}


export class Deathless extends Mechanic {
    constructor(private charges: number = 1) {
        super();
    }

    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (params) => {
                this.charges--;
                if (this.charges <= 0)
                    unit.removeMechanic(this.id(), game);
                game.playFromCrypt(unit);
                game.gameEvents.removeEvents(this);
                return params;
            }))
            return params;
        }));
    }

    public id() {
        return 'deathless';
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        if (this.charges == 1)
            return 'Deathless.';
        else
            return `Deathless (${this.charges}).`;
    }

    public evaluate(card: Card) {
        return (card as Unit).getStats() * 0.5;
    }
}

export class Immortal extends Mechanic {
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.Death, (params) => {
            game.gameEvents.addEvent(this, new GameEvent(EventType.EndOfTurn, (params) => {
                game.playFromCrypt(unit);
                return params;
            }))
            return params;
        }));
    }

    public id() {
        return 'immortal';
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Immortal.`;
    }

    public evaluate(card: Card) {
        return (card as Unit).getStats() * 2;
    }
} 