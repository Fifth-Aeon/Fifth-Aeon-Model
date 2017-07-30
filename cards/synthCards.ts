import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit } from '../unit';
import { SingleUnit, Untargeted, AllUnits } from '../targeter';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { AugarCard } from './mechanics/draw';
import { Resource } from '../resource';


export function insight() {
    return new Card(
        'Insight',
        'Insight',
        'third-eye.png',
        new Resource(1, 0, {
            Growth: 0,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        [new AugarCard()]
    );
}

