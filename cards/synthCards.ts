import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType, mechanical } from '../unit';
import { SingleUnit, Untargeted, AllUnits, AllPlayers, EnemyUnits, Friends, Enemies, Everyone } from '../targeter';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { AugarCard, DrawCard, Peek } from './mechanics/draw';
import { EndOfTurn } from './mechanics/periodic';
import { CannotAttack, CannotBlock } from './mechanics/cantAttack';
import { UnitEntersPlay } from './mechanics/entersPlay';
import { Flying, Lethal, Shielded, Relentless } from './mechanics/skills';
import { friendlyLordship } from './mechanics/lordship';
import { Annihilate } from './mechanics/removal';
import { BuffTarget } from './mechanics/buff';
import { Resource } from '../resource';
import { Robotic, SpyPower } from './mechanics/synthSpecials';
import { MechanicalUnit, BiologicalUnit } from './targeters/biotargeter';
import { DealDamage, DealSynthDamage } from './mechanics/dealDamage';
import { Poisoned } from './mechanics/poison';

export function atomicStrike() {
    return new Card(
        'atomicStrike',
        'Atomic Strike',
        'mushroom-cloud.png',
        new Resource(8, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 6
        }),
        new AllUnits(),
        [new DealDamage(10), new DealDamage(5, new AllPlayers())],
        'Deal 10 damage to each unit and 5 to each player.'
    );
}

export function titanmk2() {
    return new Unit(
        'titanmk2',
        'Titan Mk. 2',
        'megabot.png',
        UnitType.Automaton,
        new Resource(7, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 5
        }),
        new Untargeted(),
        7, 7,
        [new Robotic(), new Shielded()]
    );
}

export function spy() {
    return new Unit(
        'spy',
        'Spy',
        'spy.png',
        UnitType.Agent,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        1, 1,
        [new SpyPower()]
    );
}

export function carpetBombing() {
    return new Card(
        'BombingRun',
        'Bombing Run',
        'carpet-bombing.png',
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 4
        }),
        new EnemyUnits(),
        [new DealDamage(3)]
    );
}


export function energyBeam() {
    return new Card(
        'EnergyBeam',
        'Energy Beam',
        'sinusoidal-beam.png',
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new SingleUnit(),
        [new DealSynthDamage()]
    );
}

export function archivesSearch() {
    return new Card(
        'archivesSearch',
        'Search the Archives',
        'enlightenment.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        [new DrawCard(2)]
    );
}

export function alloyTransmute() {
    return new Card(
        'alloyTransmute',
        'Alloy Transmutation',
        'materials-science.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new MechanicalUnit(),
        [new BuffTarget(3, 6, [new Shielded()])]
    );
}


export function dangerousInjection() {
    return new Card(
        'dangerousInjection',
        'Dangerous Injection',
        'hypodermic-test.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new BiologicalUnit(),
        [new BuffTarget(3, 2, [new Poisoned()])],
        'Poison target biological unit and give it +3/+2.'
    );
}

export function workbot() {
    return new Unit(
        'workbot',
        'Workbot',
        'vintage-robot.png',
        UnitType.Automaton,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        1, 1,
        [new Robotic(),
        new UnitEntersPlay('When you play a mechanical unit give it +0/+1', 1, (source, unit) => {
            if (unit != source && unit.getOwner() == source.getOwner() && mechanical.has(unit.getUnitType())) {
                unit.buff(0, 1);
            }
        })]
    );
}

export function comsTower() {
    return new Unit(
        'ComsTower',
        'Communication Tower',
        'radar-dish.png',
        UnitType.Structure,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        0, 5,
        [new CannotAttack(), friendlyLordship(1, 1)]
    );
}


export function enhancmentChamber() {
    return new Unit(
        'enhancmentChamber',
        'Enhancement Chamber',
        'cryo-chamber.png',
        UnitType.Structure,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        0, 5,
        [new CannotAttack(),
        new UnitEntersPlay('When you play a biological unit give it +2/+2.', 5, (source, unit) => {
            if (unit.getOwner() == source.getOwner() && !mechanical.has(unit.getUnitType())) {
                unit.buff(2, 2);
            }
        })]
    );
}


export function observationBallon() {
    return new Unit(
        'ObsesrvationBallon',
        'Observation Ballon',
        'air-balloon.png',
        UnitType.Vehicle,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        0, 3,
        [new Flying(), new Peek()]
    );
}

export function siegeArtillery() {
    return new Unit(
        'siegeArtillery',
        'Siege Artillery',
        'field-gun.png',
        UnitType.Vehicle,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        1, 1,
        [new EndOfTurn('deal 1 damage to your opponent', 3, (unit, game) => {
            game.getPlayer(game.getOtherPlayerNumber(unit.getOwner())).takeDamage(1);
        })]
    );
}

export function golem() {
    return new Unit(
        'golem',
        'Golem',
        'robot-golem.png',
        UnitType.Automaton,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        3, 3,
        [new Robotic()]
    );
}

export function paragon() {
    return new Unit(
        'paragon',
        'P.A.R.A.G.O.N',
        'android-mask.png',
        UnitType.Automaton,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 4
        }),
        new Untargeted(),
        4, 5,
        [new Robotic(), new Lethal(), new Shielded(), new Relentless()]
    );
}

export function hanglider() {
    return new Unit(
        'Hanglider',
        'Scout Glider',
        'hang-glider.png',
        UnitType.Vehicle,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        3, 1,
        [new Flying(), new CannotBlock()]
    );
}

export function airship() {
    return new Unit(
        'Airship',
        'Airship',
        'zeppelin.png',
        UnitType.Vehicle,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        3, 3,
        [new Flying()]
    );
}

export function insight() {
    return new Card(
        'Insight',
        'Insight',
        'third-eye.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        [new AugarCard()]
    );
}

export function riftBlast() {
    let targeter = new SingleUnit();
    return new Card(
        'riftBlast',
        'Rift Pulse',
        'lightning-dissipation.png',
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 4
        }),
        targeter,
        [new Annihilate(targeter)]
    );
}

export function mine() {
    return new Unit(
        'Mine',
        'Gold Mine',
        'gold-mine.png',
        UnitType.Structure,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        0, 3,
        [
            new CannotAttack(),
            new EndOfTurn('draw a card and get -0/-1', 3, (unit, game) => {
                game.getPlayer(unit.getOwner()).drawCard();
                unit.buff(0, -1);
            })
        ]
    );
}

