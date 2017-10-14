// Game Types
import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Item } from '../item';
import { Unit, UnitType } from '../unit';
import { Resource } from '../resource';

// Targeters
import { SingleUnit, Untargeted, AllUnits, EnemyUnits, FriendlyUnit } from '../targeter';
import { BiologicalUnit } from './targeters/biotargeter';

// Mechanics
import { DrawCardsFromUnit, WebTarget} from './mechanics/growthSpecials';
import { DealDamage, BiteDamage } from './mechanics/dealDamage';
import { SleepTarget } from './mechanics/sleep';
import { BuffTarget } from './mechanics/buff';
import { FinalBlow } from './mechanics/finalBlow';
import { SummonUnits } from './mechanics/summonUnits';
import { Flying, Relentless, Deathless } from './mechanics/skills';
import { Affinity } from './mechanics/affinity';
import { Venomous } from './mechanics/poison';
import { GainLife, GainResource } from './mechanics/playerAid';
import { OnDeath } from './mechanics/death';


export function giantClub() {
    return new Item(
        'GiantClub',
        'Giant Club',
        'wood-club.png',
        new Resource(5, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        6, 6,
        []
    );
}


export function kraken() {
    return new Unit(
        'Kraken',
        'Kraken',
        'giant-squid.png',
        UnitType.Monster,
        new Resource(7, 0, {
            Growth: 5,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        7, 7,
        []
    );
}

export function hydra() {
    return new Unit(
        'Three headed Hydra',
        'Hydra',
        'hydra.png',
        UnitType.Dragon,
        new Resource(8, 0, {
            Growth: 6,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        5, 5,
        [new Flying(), new Deathless(3),
        new OnDeath('it gains +1/+1', 2, (unit, game) => unit.buff(1, 1))]
    );
}

export function neuralResonance() {
    return new Card(
        'NeuralResonance',
        'Synaptic Resonance',
        'brain.png',
        new Resource(6, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new FriendlyUnit(),
        [new DrawCardsFromUnit(3)]
    );
}

export function bounty() {
    return new Card(
        'NaturesBounty',
        'Nature’s Bounty',
        'fruiting.png',
        new Resource(3, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        [new GainLife(2), new GainResource(new Resource(1, 1, {
            Growth: 1,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }))],
        'You gain 1 growth, 1 energy and 2 life.'
    );
}

export function webspit() {
    return new Card(
        'webspit',
        'Spit Web',
        'web-spit.png',
        new Resource(1, 0, {
            Growth: 1,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        [new WebTarget()]

    );
}


export function bite() {
    return new Card(
        'bite',
        'Bite',
        'fangs.png',
        new Resource(2, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        [new BiteDamage()]
    );
}

export function SweetFragrance() {
    return new Card(
        'SweetFragrance',
        'Soporific Pollen',
        'fragrance.png',
        new Resource(5, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new EnemyUnits(),
        [new SleepTarget(1)]

    );
}

export function minotaur() {
    return new Unit(
        'Minotaur',
        'Minotaur',
        'minotaur.png',
        UnitType.Mammal,
        new Resource(4, 0, {
            Growth: 4,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 5,
        []
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
            Decay: 0,
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
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 1,
        [new Affinity('Gain +0/+1', 0.5, (unit, game) => unit.buff(0, 1))]
    );
}

export function spiderHatchling() {
    return new Unit(
        'SpiderHatchling',
        'Spider Hatchling',
        'masked-spider.png',
        UnitType.Spider,
        new Resource(2, 0, {
            Growth: 1,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 3,
        [new Affinity('Gain +1/+0',  0.5, (unit, game) => unit.buff(1, 0))]
    );
}

export function wasp() {
    return new Unit(
        'Wasp',
        'Wasp',
        'wasp-sting.png',
        UnitType.Insect,
        new Resource(2, 0, {
            Growth: 1,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 1,
        [new Flying(), new Venomous()]
    );
}


export function werewolf() {
    return new Unit(
        'Werewolf',
        'Werewolf',
        'werewolf.png',
        UnitType.Wolf,
        new Resource(3, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 3,
        [new Affinity('All your wolves get +1/+0', 2, (unit, game) => {
            game.getBoard().getPlayerUnits(unit.getOwner()).forEach(unit => {
                if (unit.getUnitType() == UnitType.Wolf)
                    unit.buff(1, 0);
            })
        })]
    );
}

export function bear() {
    return new Unit(
        'Bear',
        'Bear',
        'polar-bear.png',
        UnitType.Mammal,
        new Resource(3, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 4,
        []
    );
}

export function wolfHowl() {
    return new Card(
        'WolfHowl',
        'Wolf Howl',
        'wolf-howl.png',
        new Resource(4, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        [new SummonUnits(wolfPup, 2)]
    );
}

export function mutation() {
    return new Card(
        'mutation',
        'Metabolic Mutation',
        'dna1.png',
        new Resource(4, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new BiologicalUnit(),
        [new BuffTarget(3, 4, [new Relentless()])]
    );
}

export function spiderQueen() {
    return new Unit(
        'SpiderQueen',
        'Spider Queen',
        'spider-face.png',
        UnitType.Spider,
        new Resource(5, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 6,
        [new FinalBlow('Play a Toxic Spiderling', 4, (source, killed, game) =>
            game.playGeneratedUnit(game.getPlayer(source.getOwner()), venomousSpiderling()))
        ]
    );
}

export function ancientBeast() {
    return new Unit(
        'AncientBeast',
        'Ancient Beast',
        'dinosaur-rex.png',
        UnitType.Monster,
        new Resource(5, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        5, 5,
        [new Relentless()]
    );
}


export function dragon() {
    return new Unit(
        'Dragon',
        'Dragon',
        'dragon-head.png',
        UnitType.Dragon,
        new Resource(6, 0, {
            Growth: 4,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        6, 6,
        [new Flying()]
    );
}


export function eruption() {
    return new Card(
        'Eruption',
        'Eruption',
        'volcano.png',
        new Resource(6, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new AllUnits(),
        [new DealDamage(5)]
    );
}


