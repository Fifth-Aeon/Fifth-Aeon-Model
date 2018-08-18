import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game, GamePhase } from '../../game';
import { Targeter } from '../../targeter';
import { Card, CardType } from '../../card';
import { Unit, UnitType } from '../../unit';


import { Sleeping } from './sleep';
import { Poisoned } from './poison';
import { Permanent } from '../../permanent';


const robotImmunities = [new Sleeping().getId(), new Poisoned().getId()];
export class Robotic extends Mechanic {
    protected static id = 'Robotic';
    protected static validCardTypes = Permanent.cardTypes;

    public enter(card: Card, game: Game) {
        for (let immunity of robotImmunities) {
            (card as Unit).addImmunity(immunity);
        }
    }

    public remove(card: Card, game: Game) {
        for (let immunity of robotImmunities) {
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
        (card as Unit).getEvents().DealDamage.addEvent(this,  params => {
                let target = params.target as Unit;
                if (target.getUnitType() === UnitType.Player)
                    game.getPlayer(card.getOwner()).drawCard();
                return params;
            }
        );
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

