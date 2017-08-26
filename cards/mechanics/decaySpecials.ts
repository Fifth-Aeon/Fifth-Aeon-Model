import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, Location } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

import { remove } from 'lodash';

export class TransformDamaged extends Mechanic {
    private unitDesc: string;
    constructor(private transformation: () => Unit) {
        super();
        let unit = transformation();
        this.unitDesc = `${unit.getName()}`;
    }

    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.DealDamage, (params) => {
            let target = params.get('target') as Unit;
            if (target.getType() == UnitType.Player)
                return params;
            target.transform(this.transformation(), game)
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Transform any unit this damages into a ${this.unitDesc}.`;
    }
}

export class DamageSpawnOnKill extends TargetedMechanic {
    private name: string;
    constructor(private amount: number, private factory: () => Unit) {
        super();
        this.name = factory().getName();
    }

    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.takeDamage(this.amount);
            target.checkDeath();
            if (target.getLocation() == Location.Crypt) {
                game.playGeneratedUnit(card.getOwner(), this.factory());
            }
        }
    }

    public getText(card: Card) {
        return `Deal ${this.amount} damage to ${this.targeter.getText()}. If it dies play a ${this.name}.`
    }
}


export class AbominationConsume extends Mechanic {
    public run(card: Card, game: Game) {
        let crypt = game.getCrypt(card.getOwner());
        let valid = crypt.filter(card => card.isUnit());
        let unit = card as Unit;
        game.promptCardChoice(card.getOwner(), valid, 2, (raised: Card[]) => {
            raised.forEach(card => {
                let eaten = card as Unit;
                unit.buff(eaten.getDamage(), eaten.getMaxLife());
                remove(crypt, eaten);
            })
        }, 'to combine');
    }

    public getText(card: Card) {
        return `Remove up to two units from your crypt. This unit gains their stats.`;
    }
}

export class SummonUnitForGrave extends Mechanic {
    private name: string;
    constructor(private factory: () => Unit, private factor: number) {
        super();
        this.name = factory().getName();
    }

    public run(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        let count = Math.floor(game.getCrypt(0)
            .concat(game.getCrypt(1))
            .filter(card => card.isUnit()).length / this.factor);
        for (let i = 0; i < count; i++) {
            game.playGeneratedUnit(owner, this.factory())
        }
    }

    public getText(card: Card) {
        return `Play a ${this.name} for each ${this.factor} units in any crypt (rounded down).`;
    }
}
