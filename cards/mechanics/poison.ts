import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';


export class CurePoisonTargeter extends Targeter {
    public getValidTargets(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        return game.getBoard()
            .getPlayerUnits(game.getOtherPlayerNumber(card.getOwner()))
            .filter(unit => unit.hasMechanicWithId('poison'))
    }
    
    public getText() {
        return 'target posioned unit';
    }
}

export class CurePoison extends TargetedMechanic {
    public run(card: Card, game: Game) {
        this.targeter.getTargets(card, game).forEach(target => {
            target.removeMechanic('poison', target, game);
        });
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Cure ${this.targeter.getText()}.`;
    }
}

export class Poisoned extends Mechanic {
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == unit.getOwner())
                unit.buff(-1, -1);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public id() {
        return 'poison';
    }

    public getText(card: Card) {
        return 'Poisoned.';
    }
}

export class PoisonTarget extends TargetedMechanic {
    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.addMechanic(new Poisoned(), game);
        }
    }

    public getText(card: Card) {
        return `Poison ${this.targeter.getText()}.`
    }
}


export class Venomous extends Mechanic {
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.DealDamage, (params) => {
            console.log('venom trigger');
            let target = params.get('target') as Unit;
            if (target.getType() != UnitType.Player)
                target.addMechanic(new Poisoned(), game)
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return 'Venomous.';
    }
}
