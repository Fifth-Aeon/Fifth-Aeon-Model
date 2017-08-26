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
            .getPlayerUnits(card.getOwner())
            .filter(unit => unit.hasMechanicWithId('poison'))
    }

    public getText() {
        return 'target posioned unit';
    }

    public optional() {
        return true;
    }
}

export class CurePoison extends TargetedMechanic {
    public run(card: Card, game: Game) {
        this.targeter.getTargets(card, game).forEach(target => {
            target.removeMechanic('poisoned', game);
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
    private level = 1;
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        game.gameEvents.addEvent(this, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == unit.getOwner())
                unit.buff(-this.level, -this.level);
            return params;
        }));
    }

    public stack() {
        this.level++;
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public id() {
        return 'poisoned';
    }

    public getText(card: Card) {
        if (this.level == 1)
            return 'Poisoned.';
        else 
            return `Poisoned (${this.level}).`
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

    public evaluateTarget(owner: number, target: Unit) {
        return target.evaluate() * 0.5 * (target.getOwner() == owner ? -1 : 1);
    }
}

export class Venomous extends Mechanic {
    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.DealDamage, (params) => {
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
