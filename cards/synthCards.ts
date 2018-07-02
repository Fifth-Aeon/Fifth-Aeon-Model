import { Card } from '../card';
import { Enchantment } from '../enchantment';
import { Item } from '../item';
import { Resource, ResourceType } from '../resource';
import { Unit, UnitType } from '../unit';
import { BuffTarget, BuffTargetAndGrant, GrantAbility } from './mechanics/buff';
import { CannotAttack, CannotBlock } from './mechanics/cantAttack';
import { DamageOnBlock, DealDamage, DealResourceDamage } from './mechanics/dealDamage';
import { AugarCard, DrawCard, Peek } from './mechanics/draw';
import { RefreshTarget } from './mechanics/heal';
import { friendlyLordship } from './mechanics/lordship';
import { Poisoned, PoisonImmune } from './mechanics/poison';
import { Annihilate } from './mechanics/removal';
import { ForceField } from './mechanics/shieldEnchantments';
import { Aquatic, Flying, Lethal, Ranged, Relentless, Shielded, Unblockable } from './mechanics/skills';
import { EnchantmentSummon } from './mechanics/summonUnits';
import { Robotic, SpyPower } from './mechanics/synthSpecials';
// Mechanics
import {
    Enemies, EnemyPlayer, EnemyUnit, EnemyUnits, FriendlyUnit,
    SelfTarget, SingleUnit, TriggeringUnit, Untargeted, FriendlyUnits
} from './targeters/basicTargeter';
import { BiologicalUnit, FrendlyBiologicalUnits, MechanicalUnit, FrieldyVehicleOrStructure } from './targeters/biotargeter';
import { UnitOfType } from './targeters/unitTypeTargeter';
import { FriendlyBiologicalUnitEntersPlay, FriendlyMechanicalUnitEntersPlay } from './triggers/bio';
import { Dusk, Cycle, Dawn } from './triggers/periodic';


export function assemblyLine() {
    return new Enchantment(
        'AssemblyLine',
        'Assembly Line',
        'factory-arm.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        5, 1,
        [new EnchantmentSummon(automatedInfantry, 1).setTrigger(new Dusk())]
    );
}

export function medicalConvoy() {
    return new Unit(
        'MedicalConvoy',
        'Medical Convoy',
        'military-ambulance.png',
        UnitType.Vehicle,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        2, 2,
        [new RefreshTarget().setTargeter(new FrendlyBiologicalUnits())]
    );
}

export function automatedInfantry() {
    return new Unit(
        'AutomatedInfantry',
        'Automated Infantry',
        'battle-mech.png',
        UnitType.Automaton,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        1, 2,
        [new Robotic()]
    );
}

export function interceptor() {
    return new Unit(
        'Interceptor',
        'Prototype Interceptor',
        'biplane.png',
        UnitType.Vehicle,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        1, 2,
        [new Flying(), new DamageOnBlock(3)]
    );
}

export function forceField() {
    return new Enchantment(
        'ForceField',
        'Forcefield Matrix',
        'nested-hexagons.png',
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        1, 12,
        [new ForceField()]
    );
}

export function gasMask() {
    return new Item(
        'GasMask',
        'Gas Mask',
        'gas-mask.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        new FriendlyUnit(),
        1, 2,
        [new PoisonImmune()]
    );
}

export function battleship() {
    return new Unit(
        'Battleship',
        'Battleship',
        'battleship.png',
        UnitType.Vehicle,
        new Resource(7, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 4
        }),
        new Untargeted(),
        7, 7,
        [new Aquatic()]
    );
}


export function missleMech() {
    return new Unit(
        'MissileMech',
        'Missile Mech',
        'missile-mech.png',
        UnitType.Vehicle,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        4, 4,
        [new Ranged()]
    );
}

export function satalite() {
    return new Unit(
        'SpySatalite',
        'Spy Satalite',
        'sattelite.png',
        UnitType.Vehicle,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new Untargeted(),
        0, 2,
        [
            new CannotAttack(),
            new CannotBlock(),
            new DrawCard().setTrigger(new Dawn()),
            new Peek().setTrigger(new Dawn()),
        ]
    );
}

export function shieldGenerator() {
    return new Unit(
        'ShieldGenerator',
        'Shield Generator',
        'crystal-shine.png',
        UnitType.Structure,
        new Resource(7, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 4
        }),
        new Untargeted(),
        0, 6,
        [
            new CannotAttack(),
            new GrantAbility(Shielded)
                .setTrigger(new Dawn())
                .setTargeter(new FriendlyUnits())
        ]
    );
}

export function submarine() {
    return new Unit(
        'Submarine',
        'Submarine',
        'submarine.png',
        UnitType.Vehicle,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        3, 4,
        [new Aquatic(), new Unblockable()]
    );
}

export function automataCrew() {
    return new Item(
        'AutomataCrew',
        'Automata Crew',
        'vintage-robot.png',
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        new FrieldyVehicleOrStructure(),
        3, 3,
        [new Robotic(), new Relentless()]
    );
}

export function occularImplant() {
    return new Item(
        'OccularImplant',
        'Occular Implant',
        'cyber-eye.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new Untargeted(),
        new FriendlyUnit(),
        3, 3,
        [new SpyPower()]
    );
}

export function rifle() {
    return new Item(
        'Rifle',
        'Marksman\'s Rifle',
        'winchester-rifle.png',
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 2
        }),
        new EnemyUnit(),
        new FriendlyUnit(),
        3, 2,
        [new Ranged(), new DealDamage(2)]
    );
}

export function atomicStrike() {
    return new Card(
        'AtomicStrike',
        'Atomic Strike',
        'mushroom-cloud.png',
        new Resource(12, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 6
        }),
        new Enemies(),
        [new DealDamage(7)]
    );
}

export function titanmk2() {
    return new Unit(
        'TitanMk2',
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
        'Spy',
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
        [new DealResourceDamage(ResourceType.Synthesis)]
    );
}

export function archivesSearch() {
    return new Card(
        'ArchivesSearch',
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
        'AlloyTransmute',
        'Alloy Transmutation',
        'materials-science.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 3
        }),
        new MechanicalUnit(),
        [new BuffTargetAndGrant(3, 6, [new Shielded()])]
    );
}

export function dangerousInjection() {
    return new Card(
        'DangerousInjection',
        'Dangerous Injection',
        'hypodermic-test.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new BiologicalUnit(),
        [new BuffTargetAndGrant(3, 2, [new Poisoned()])],
        'Poison target biological unit and give it +3/+2.'
    );
}


export function workbot() {
    return new Unit(
        'Workbot',
        'Workbot',
        'tracked-robot.png',
        UnitType.Automaton,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 1
        }),
        new Untargeted(),
        1, 1,
        [
            new Robotic(),
            new BuffTarget(0, 1)
                .setTargeter(new TriggeringUnit())
                .setTrigger(new FriendlyMechanicalUnitEntersPlay())
        ]
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
        'EnhancmentChamber',
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
        new BuffTarget(3, 3)
            .setTargeter(new TriggeringUnit())
            .setTrigger(new FriendlyBiologicalUnitEntersPlay())
        ]
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
        'SiegeArtillery',
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
        [new DealDamage(1).setTargeter(new EnemyPlayer()).setTrigger(new Dusk())]
    );
}

export function golem() {
    return new Unit(
        'Golem',
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
        'Paragon',
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
        'ScoutGlider',
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
    return new Card(
        'RiftBlast',
        'Rift Pulse',
        'lightning-dissipation.png',
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 0,
            Synthesis: 4
        }),
        new SingleUnit(),
        [new Annihilate()]
    );
}

export function mine() {
    return new Unit(
        'GoldMine',
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
            new DrawCard(1).setTrigger(new Dusk()),
            new BuffTarget(0, -1).setTargeter(new SelfTarget()).setTrigger(new Dusk())
        ]
    );
}

