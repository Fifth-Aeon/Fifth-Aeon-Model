import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { Resource } from '../resource';

import { SingleUnit, Untargeted, AllUnits } from '../targeter';
import { CannotAttack } from './mechanics/cantAttack';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { RenewalMCTargeter, MindControl } from './mechanics/mindControl';
import { Lordship, unitTypeLordship } from './mechanics/lordship';
import { Serenity } from './mechanics/serenity';
import { SummonUnits } from './mechanics/summonUnits';
import { Flying, Relentless } from './mechanics/skills';
import { CurePoisonTargeter, CurePoison } from './mechanics/poison';

export function ruralMonk() {
    return new Unit(
        'RuralMonk',
        'Traveling Monk',
        'monk-face.png',
        UnitType.Cleric,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        1, 2,
        [new Serenity('Gain 1 life', (unit, game) => game.getPlayer(unit.getOwner()).addLife(1))]
    );
}

export function pikeman() {
    return new Unit(
        'Pikeman',
        'Pikeman',
        'pikeman.png',
        UnitType.Soldier,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 1,
        []
    );
}

export function unicorn() {
    return new Unit(
        'Unicorn',
        'Unicorn',
        'unicorn.png',
        UnitType.Mammal,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        2, 3,
        []
    );
}

export function monestary() {
    return new Unit(
        'Monastery',
        'Monastery',
        'church.png',
        UnitType.Structure,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new Untargeted(),
        0, 5,
        [new CannotAttack(),
        new Serenity('Play a Traveling Monk', (unit, game) => {
            let player = game.getPlayer(unit.getOwner());
            game.playGeneratedUnit(player, ruralMonk());
        })]
    );
}

export function castle() {
    return new Unit(
        'Castle',
        'Castle',
        'castle.png',
        UnitType.Structure,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 7,
        [new CannotAttack()]
    );
}

export function plaugeDoctor() {
    return new Unit(
        'PlagueDoctor',
        'Plague Doctor',
        'plague-doctor-profile.png',
        UnitType.Human,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new CurePoisonTargeter(),
        2, 2,
        [new CurePoison()]
    );
}

export function knight() {
    return new Unit(
        'Knight',
        'Knight',
        'mounted-knight.png',
        UnitType.Soldier,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 3,
        []
    );
}

export function recruitment() {
    return new Card(
        'recruitment',
        'Rapid Recruitment',
        'rally-the-troops.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        [new SummonUnits(pikeman, 2)]
    );
}

export function armstice() {
    return new Card(
        'Armstice',
        'Armstice',
        'tied-scroll.png',
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new AllUnits(),
        [new ShuffleIntoDeck()]
    );
}

export function callOfJustice() {
    let targeter = new RenewalMCTargeter();
    return new Card(
        'CallOfJustice',
        'Call of Justice',
        'scales.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        targeter,
        [new MindControl(targeter)]
    );
}


export function angel() {
    return new Unit(
        'SentryAngel',
        'Sentry Angel',
        'angel-wings.png',
        UnitType.Cleric, 
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 7,
        [new Flying(), new Relentless()]
    );
}

export function pontiff() {
    return new Unit(
        'Pontiff',
        'Pontiff',
        'pope-crown.png',
        UnitType.Cleric, 
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new Untargeted(),
        3, 3,
        [unitTypeLordship(UnitType.Cleric, 1, 1)]
    );
}


