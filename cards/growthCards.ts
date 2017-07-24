import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted } from '../targeter';
import { DealDamage } from './mechanics/dealDamage';
import { Affinity } from './mechanics/affinity';
import { Resource } from '../resource';

export function spiderHatchling() {
    return new Unit(
        'SpiderHatchling',
        'Spider Hatchling',
        'growth.png',
        UnitType.Spider,
        new Resource(1, 0, {
            Growth: 1,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 2,
        [new Affinity('Gain +1 damage.', (unit, game) => unit.buff(1, 0))]
    );
} 
 
export function wolfPup() {
    return new Unit(
        'WolfPup',
        'Wolf Pup',
        'growth.png',
        UnitType.Wolf,
        new Resource(1, 0, {
            Growth: 1,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 1,
        [new Affinity('Gain +1 maximum life.', (unit, game) => unit.buff(0, 1))]
    );
}

