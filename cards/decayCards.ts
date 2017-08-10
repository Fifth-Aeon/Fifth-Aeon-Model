import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { Resource } from '../resource';

import { SingleUnit, Untargeted, AllUnits, AllOtherUnits } from '../targeter';
import { Flying, Lethal, Lifesteal } from './mechanics/skills';
import { Discard } from './mechanics/draw';
import { FinalBlow } from './mechanics/finalBlow';
import { CannotAttack } from './mechanics/cantAttack';
import { PoisonTarget } from './mechanics/poison';
import { ReturnFromCrypt } from './mechanics/returnFromCrypt';
import { TransformDamaged, AbominationConsume } from './mechanics/decaySpecials';
import { OnDeath } from './mechanics/death';
import { KillTarget } from './mechanics/removal';


export function poison() {
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
        new SingleUnit(),
        [new PoisonTarget()]
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

export function rottingZombie() {
    return new Unit(
        'RottingZombie',
        'Rotting Zombie',
        'shambling-zombie.png',
        UnitType.Undead,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 2,
        [new OnDeath('play a Crawling Zombie', (unit, game) =>
            game.playGeneratedUnit(game.getPlayer(unit.getOwner()), crawlingZombie()))]
    )
}

export function decapitate() {
    return new Card(
        'Decapitate',
        'Decapitate',
        'decapitation.png',
        new Resource(4, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        [new KillTarget()]
    )
}

export function Saboteur() {
    return new Unit(
        'Saboteur',
        'Saboteur',
        'hooded-figure.png',
        UnitType.Agent,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 2,
        [new Discard()]
    )
}

export function Abomination() {
    return new Unit(
        'Abomination',
        'Abomination',
        'frankenstein-creature.png',
        UnitType.Undead,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        3, 3,
        [new AbominationConsume()]
    )
}

export function Assassin() {
    return new Unit(
        'Assassin',
        'Assassin',
        'hooded-assassin.png',
        UnitType.Agent,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        2, 2,
        [new PoisonTarget(), new Lethal()]
    )
}



export function vampire() {
    return new Unit(
        'Vampire1',
        'Vamprie',
        'vampire.png',
        UnitType.Vampire,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 3,
        [new FinalBlow('Gain +1/+1', (unit) => unit.buff(1, 1))]
    )
}

export function bat() {
    return new Unit(
        'VampireBat',
        'Vamprie Bat',
        'bat.png',
        UnitType.Vampire,
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
        UnitType.Cultist,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 5,
            Renewal: 0,
            Synthesis: 0
        }),
        new AllOtherUnits(),
        4, 4,
        [new PoisonTarget()]
    )
}

function statue() {
    return new Unit(
        'Statue',
        'Statue',
        'stone-bust.png',
        UnitType.Structure,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        0, 1,
        [new CannotAttack()]
    )
}

export function gorgon() {
    return new Unit(
        'Gorgon',
        'Gorgon',
        'medusa-head.png',
        UnitType.Monster,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 5,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 7,
        [new TransformDamaged(statue)]
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


