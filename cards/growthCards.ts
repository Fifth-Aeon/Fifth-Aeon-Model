import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted } from '../targeter';
import { DealDamage } from './mechanics/dealDamage';
import { Resource } from '../resource';

import { Affinity } from './mechanics/affinity';
import { Venomous } from './mechanics/poison';

export function spiderHatchling() {
    return new Unit(
        'SpiderHatchling',
        'Spider Hatchling',
        'masked-spider.png',
        UnitType.Spider,
        new Resource(1, 0, {
            Growth: 1,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 2,
        [new Affinity('Gain +1/+0', (unit, game) => unit.buff(1, 0))]
    );
} 

export function venomousSpiderling() {
    return new Unit(
        'Spiderling',
        'Toxic Spiderling',
        'hanging-spider.png',
        UnitType.Spider,
        new Resource(1, 0, {
            Growth: 1,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 1,
        [new Venomous()]
    );
} 
 
export function wolfPup() {
    return new Unit(
        'WolfPup',
        'Wolf Pup',
        'wolf-head.png',
        UnitType.Wolf,
        new Resource(1, 0, {
            Growth: 1,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 1,
        [new Affinity('Gain +0/+1', (unit, game) => unit.buff(0, 1))]
    );
}

