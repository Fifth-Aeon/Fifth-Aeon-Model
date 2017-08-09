import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted } from '../targeter';
import { DealDamage } from './mechanics/dealDamage';
import { Resource } from '../resource';

import { Flying } from './mechanics/skills';
import { Affinity } from './mechanics/affinity';
import { Venomous } from './mechanics/poison';

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



