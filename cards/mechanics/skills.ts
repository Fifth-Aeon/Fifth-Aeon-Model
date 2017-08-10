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
}

export class Lethal extends Mechanic {
    public run(card: Card, game: Game) {
        (card as Unit).getEvents().addEvent(this, new GameEvent(
            EventType.DealDamage, params => {
                let target = params.get('target') as Unit;
                if (target.getType() != UnitType.Player)
                    target.kill(false);
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
}