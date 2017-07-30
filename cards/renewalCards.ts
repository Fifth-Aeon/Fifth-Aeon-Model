import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType} from '../unit';
import { SingleUnit, Untargeted, AllUnits } from '../targeter';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { RenewalMCTargeter, MindControl } from './mechanics/mindControl';
import { Resource } from '../resource';


 
export function ruralMonk() {
    return new Unit(
        'RuralMonk',
        'Rural Monk',
        'monk-face.png',
        UnitType.Human,
        new Resource(1, 0, {
            Growth: 0,
            Necrosis: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 2,
        []
    );
}



export function armstice() {
    return new Card(
        'Armstice',
        'Armstice',
        'tied-scroll.png',
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

export function callOfJustice() {
    let targeter = new RenewalMCTargeter();
    return new Card(
        'CallOfJustice',
        'Call of Justice',
        'king.png',
        new Resource(4, 0, {
            Growth: 0,
            Necrosis: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        targeter,
        [new MindControl(targeter)]
    );
}

