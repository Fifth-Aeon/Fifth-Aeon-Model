import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted, AllUnits } from '../targeter';
import { DealDamage } from './mechanics/dealDamage';
import { Resource } from '../resource';

import { BuffTarget } from './mechanics/buff';
import { FinalBlow } from './mechanics/finalBlow';
import { SummonUnits } from './mechanics/summonUnits';
import { Flying, Relentless } from './mechanics/skills';
import { Affinity } from './mechanics/affinity';
import { Venomous } from './mechanics/poison';

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
        [new Affinity('Gain +0/+1', (unit, game) => unit.buff(0, 1))]
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
        [new Affinity('Gain +1/+0', (unit, game) => unit.buff(1, 0))]
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
        [new Affinity('All your wolves get +1/+0', (unit, game) => {
            game.getBoard().getPlayerUnits(unit.getOwner()).forEach(unit => {
                if (unit.getType() == UnitType.Wolf)
                    unit.buff(1, 0);

            })
        })]
    );
}

export function bear() {
    return new Unit(
        'Bear',
        'Bear',
        'bear-head.png',
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
        new SingleUnit(),
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
            Growth: 4,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 6,
        [new FinalBlow('Play a Toxic Spiderling', (source, killed, game) =>
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
            Growth: 4,
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
        [new DealDamage(4)]
    );
}


