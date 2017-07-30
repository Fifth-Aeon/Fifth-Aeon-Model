import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted, AllUnits, AllUnitsOtherUnits } from '../targeter';
import { PoisonTarget } from './mechanics/poison';
import { Resource } from '../resource';

export function poison() {
    let targeter = new SingleUnit();
    return new Card(
        'Poison',
        'Poison',
        'death-juice.png',
        new Resource(1, 0, {
            Growth: 0,
            Necrosis: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        targeter,
        [new PoisonTarget(targeter)]
    );
}

export function crawlingZombie() {
    return new Unit(
        'CrawlingZombie',
        'Crawling Zombie',
        'half-body-crawling.png',
        UnitType.Undead,
        new Resource(1, 0, {
            Growth: 0,
            Necrosis: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 1,
        []
    )
}

export function princeOfDecay() {
    return new Unit(
        'PriceOfDecay',
        'Prince of Decay',
        'cultist.png',
        UnitType.Human,
        new Resource(8, 0, {
            Growth: 0,
            Necrosis: 6,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 4,
        [new PoisonTarget(new AllUnitsOtherUnits())]
    )
}

