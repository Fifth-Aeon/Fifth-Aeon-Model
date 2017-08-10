import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';

import {remove} from 'lodash';

export class TransformDamaged extends Mechanic {
    private unitDesc: string;
    constructor(private transformation: () => Unit) {
        super();
        let unit = transformation();
        this.unitDesc = `${unit.getDamage()}/${unit.getLife()} ${unit.getName()}`
    }

    public run(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().addEvent(this, new GameEvent(EventType.DealDamage, (params) => {
            let target = params.get('target') as Unit;
            if (target.getType() == UnitType.Player)
                return params;
            target.transform(this.transformation())
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


export class AbominationConsume extends Mechanic {
    public run(card: Card, game: Game) {
        let crypt = game.getCrypt(card.getOwner()).filter(card => card.isUnit());
        let unit = card as Unit;
        game.promptCardChoice(card.getOwner(), crypt, 1, (raised: Card[]) => {
            let eaten = raised[0] as Unit;
            unit.buff(eaten.getDamage(), eaten.getMaxLife());
            remove(crypt, eaten)
        });
    }

    public getText(card: Card) {
        return `Consume a unit in your crypt and gain its stats.`;
    }
}
