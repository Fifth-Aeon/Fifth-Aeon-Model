import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit } from '../unit';
import { SingleUnit, Untargeted } from '../targeter';
import { DealDamage } from './mechanics/dealDamage';
import { Resource } from '../resource';

export function makeGrowth1() {
    return new Unit(
        'G1',
        'Growth Unit 1',
        'growth.png',
        new Resource(1, 1, {
            Growth: 1,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 2,
        []
    );
}


export function makeGrowth2() {
    return new Unit(
        'G2',
        'Growth Unit 2',
        'growth.png',
        new Resource(2, 2, {
            Growth: 2,
            Necrosis: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 3,
        []
    );
}