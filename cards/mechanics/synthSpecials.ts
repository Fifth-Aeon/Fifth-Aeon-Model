import { Card } from '../../card';
import { Game } from '../../game';
import { Mechanic } from '../../mechanic';
import { Permanent } from '../../permanent';
import { Unit, UnitType } from '../../unit';
import { Poisoned } from './poison';
import { Sleeping } from './sleep';

const robotImmunities = [Sleeping.getId(), Poisoned.getId()];
export class Robotic extends Mechanic {
    protected static id = 'Robotic';
    protected static validCardTypes = Permanent.cardTypes;

    public enter(card: Card, game: Game) {
        for (const immunity of robotImmunities) {
            (card as Unit).addImmunity(immunity);
        }
    }

    public remove(card: Card, game: Game) {
        for (const immunity of robotImmunities) {
            (card as Unit).removeImmunity(immunity);
        }
    }

    public getId() {
        return 'robotic';
    }

    public getText(card: Card) {
        return `Robotic.`;
    }

    public evaluate() {
        return 1;
    }
}
export class SpyPower extends Mechanic {
    protected static id = 'SpyPower';
    protected static validCardTypes = Permanent.cardTypes;

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().dealDamage.addEvent(this, params => {
            const target = params.target as Unit;
            if (target.getUnitType() === UnitType.Player) {
                game.getPlayer(card.getOwner()).drawCard();
            }
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return 'Whenever this damages your opponent draw a card.';
    }

    public evaluate() {
        return 3;
    }
}
