import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit } from '../unit';
import { SingleUnit, Untargeted, AllUnits } from '../targeter';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { Resource } from '../resource';

export function armstice() {
    return new Card(
        'Armstice',
        'Armstice',
        'renewal.png',
        new Resource(6, 0, {
            Growth: 0,
            Necrosis: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new Untargeted(),
        [new ShuffleIntoDeck(new AllUnits())]
    );
}

