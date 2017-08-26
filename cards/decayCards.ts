import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { Resource } from '../resource';

// Targeters
import { DamagedUnit } from './targeters/weakenedUnits';
import { SingleUnit, Untargeted, AllUnits, AllOtherUnits } from '../targeter';

// Mechanics
import { Flying, Lethal, Lifesteal, Deathless } from './mechanics/skills';
import { Discard } from './mechanics/draw';
import { FinalBlow } from './mechanics/finalBlow';
import { EndOfTurn } from './mechanics/periodic';
import { CannotAttack } from './mechanics/cantAttack';
import { PoisonTarget } from './mechanics/poison';
import { ReturnFromCrypt } from './mechanics/returnFromCrypt';
import { TransformDamaged, AbominationConsume, DamageSpawnOnKill, SummonUnitForGrave } from './mechanics/decaySpecials';
import { OnDeath, OnDeathAnyDeath } from './mechanics/death';
import { KillTarget } from './mechanics/removal';


export function skeleton() {
    return new Unit(
        'Skeleton',
        'Skeleton',
        'skeleton.png',
        UnitType.Undead,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 1,
        [new Deathless()]
    )
}


export function lich() {
    return new Unit(
        'Lich',
        'Lich',
        'crowned-skull.png',
        UnitType.Undead,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 4,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 4,
        [new Deathless(), new OnDeathAnyDeath('play a Skeleton', (lich, dying, game) => {
            game.playGeneratedUnit(lich.getOwner(), skeleton());
        })]
    )
}

export function Hemmorage() {
    return new Card(
        'Hemorrhage',
        'Neural Hemorrhage',
        'bleeding-eye.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        [new Discard(2)]
    );
}

export function VampireBite() {
    return new Card(
        'VampireBite',
        'Vampire Bite',
        'neck-bite.png',
        new Resource(4, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        [new DamageSpawnOnKill(2, vampire)]
    );
}

export function backstab() {
    return new Card(
        'Backstab',
        'Backstab',
        'backstab.png',
        new Resource(2, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new DamagedUnit(),
        [new KillTarget()]
    );
}

export function raiseSkeletons() {
    return new Card(
        'raiseSeeleton',
        'Raise Skeletons',
        'raise-skeleton.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        [new SummonUnitForGrave(skeleton, 2)]
    );
}


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
        [new Discard(1)]
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
        new Untargeted(),
        0, 1,
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
        'Vampire',
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
        [new FinalBlow('Gain +1/+1', (unit) => {
            unit.buff(1, 1)
        })]
    )
}

export function bat() {
    return new Unit(
        'VampireBat',
        'Vampire Bat',
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
            Decay: 4,
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
            Decay: 4,
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


