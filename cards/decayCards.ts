import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted, AllUnits, AllUnitsOtherUnits } from '../targeter';
import { Flying, Lifesteal} from './mechanics/skills';
import { FinalBlow } from './mechanics/finalBlow';
import { PoisonTarget } from './mechanics/poison';
import { ReturnFromCrypt } from './mechanics/returnFromCrypt';
import { Resource } from '../resource';

export function poison() {
    let targeter = new SingleUnit();
    return new Card(
        'Poison',
        'Toxin',
        'death-juice.png',
        new Resource(2, 0, {
            Growth: 0,
            Decay: 1,
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
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 1,
        []
    )
}

export function vampire() {
    return new Unit(
        'Vampire1',
        'Vamprie Flegling',
        'vampire.png',
        UnitType.Undead,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 2,
        [new FinalBlow('Gain +1/+1', (unit) => unit.buff(1, 1))]
    )
}

export function bat() {
    return new Unit(
        'VampireBat',
        'Vamprie Bat',
        'bat.png',
        UnitType.Undead,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 2,
        [new Flying(), new Lifesteal()]
    )
}

export function princeOfDecay() {
    return new Unit(
        'PriceOfDecay',
        'Prince of Decay',
        'cultist.png',
        UnitType.Human,
        new Resource(7, 0, {
            Growth: 0,
            Decay: 5,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 4,
        [new PoisonTarget(new AllUnitsOtherUnits())]
    )
}

export function unbury() {
    return new Card(
        'Unbury',
        'Unearth',
        'coffin.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        [new ReturnFromCrypt((card) => card.isUnit())]
    )
}


