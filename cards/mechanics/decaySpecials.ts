import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, Location } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

import { remove, take, sumBy } from 'lodash';

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
            if (target.getUnitType() == UnitType.Player)
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

    public evaluate() {
        return 6;
    }

    public id() {
        return 'transfomTarget';
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

    private getValidPool(card: Card, game: Game): Unit[] {
        return game.getCrypt(card.getOwner())
            .filter(card => card.isUnit()) as Unit[];
    }

    public getText(card: Card) {
        return `Remove up to two units from your crypt. This unit gains their stats.`;
    }

    public evaluate(card: Card, game: Game) {
        if (card.getLocation() == Location.Board)
            return 0;
        let valid = this.getValidPool(card, game).sort((unitA, unitB) => unitB.getStats() - unitA.getStats());
        return sumBy(take(valid, 2), (unit) => unit.getStats());
    }
}
