import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted, AllUnits } from '../targeter';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { AugarCard } from './mechanics/draw';
import { EndOfTurn } from './mechanics/periodic';
import { CannotAttack } from './mechanics/cantAttack';
import { Resource } from '../resource';


export function insight() {
    return new Card(
        'Insight',
        'Insight',
        'third-eye.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        [new AugarCard()]
    );
}

export function mine() {
    return new Unit(
        'Mine',
        'Gold Mine',
        'gold-mine.png',
        UnitType.Structure,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        0, 3,
        [new CannotAttack(),
        new EndOfTurn('draw a card and get -0/-1', (unit, game) => {
            game.getPlayer(unit.getOwner()).drawCard();
            unit.buff(0, -1);
        })]
    );
}

