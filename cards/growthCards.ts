import { Card } from '../card-types/card';
import { Enchantment } from '../card-types/enchantment';
import { Item } from '../card-types/item';
import { Resource } from '../resource';
import { Unit, UnitType } from '../card-types/unit';
import { BuffTarget, GrantAbility } from './mechanics/buff';
import { BiteDamage, DealDamage } from './mechanics/dealDamage';
import { DrawCard } from './mechanics/draw';
import { Discharge } from './mechanics/enchantmentCounters';
import { DrawCardsFromUnit, WebTarget } from './mechanics/growthSpecials';
import { GainLife, GainResource } from './mechanics/playerAid';
import { PoisonTarget, Venomous } from './mechanics/poison';
import { KillTarget } from './mechanics/removal';
import {
    Aquatic,
    Deathless,
    Flying,
    Lethal,
    Ranged,
    Relentless,
    Rush
} from './mechanics/skills';
import { SleepTarget } from './mechanics/sleep';
import { SummonUnits } from './mechanics/summonUnits';
import {
    AllOtherUnits,
    AllUnits,
    EnemyUnit,
    EnemyUnits,
    FriendlyUnit,
    SelfTarget,
    SingleUnit,
    Untargeted
} from './targeters/basicTargeter';
import { BiologicalUnit } from './targeters/biotargeter';
import { UnitWithAbility } from './targeters/mechanicTargeter';
import { SleepableUnit } from './targeters/poisonTargeter';
import { LifeLessUnits } from './targeters/powerTargeter';
import { UnitsOfType, UnitsOfTypeAsTarget } from './targeters/unitTypeTargeter';
import { Affinity } from './triggers/affinity';
import { DeathTrigger } from './triggers/death';
import { LethalStrike } from './triggers/lethalStrike';
import { Cycle, Dawn } from './triggers/periodic';

export function flourishing() {
    return new Enchantment(
        'Flourishing',
        'Flourishing',
        'beech.png',
        new Resource(5, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        5,
        3,
        [
            new GainResource(
                new Resource(1, 1, {
                    Growth: 1,
                    Decay: 0,
                    Renewal: 0,
                    Synthesis: 0
                })
            ).setTrigger(new Dawn()),
            new Discharge(1)
        ]
    );
}

export function fairy() {
    return new Unit(
        'Fairy',
        'Fairy',
        'fairy.png',
        UnitType.Human,
        new Resource(3, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        1,
        [new Flying(), new DrawCard(1).setTrigger(new DeathTrigger())]
    );
}

export function botanicElemental() {
    return new Unit(
        'BotanicElemental',
        'Botanic Elemental',
        'shambling-mound.png',
        UnitType.Human,
        new Resource(5, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3,
        3,
        [
            new BuffTarget(1, 1)
                .setTargeter(new SelfTarget())
                .setTrigger(new Dawn())
        ]
    );
}

export function elderDragon() {
    return new Unit(
        'ElderDragon',
        'Elder Dragon',
        'spiked-dragon-head.png',
        UnitType.Dragon,
        new Resource(10, 0, {
            Growth: 6,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new EnemyUnit(),
        8,
        8,
        [new Flying(), new DealDamage(8)]
    );
}

export function mermaid() {
    return new Unit(
        'Mermaid',
        'Mermaid',
        'mermaid.png',
        UnitType.Human,
        new Resource(2, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2,
        2,
        [new Aquatic()]
    );
}

export function elvenBow() {
    return new Item(
        'ElvenBow',
        'Elven Bow',
        'pocket-bow.png',
        new Resource(1, 0, {
            Growth: 1,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new SingleUnit(),
        new FriendlyUnit(),
        1,
        0,
        [new Ranged(), new DealDamage(1)]
    );
}

export function plauge() {
    return new Enchantment(
        'DeadlyPlague',
        'Deadly Plague',
        'virus.png',
        new Resource(4, 0, {
            Growth: 3,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4,
        1,
        [
            new PoisonTarget()
                .setTargeter(new AllUnits())
                .setTrigger(new Cycle()),
            new Discharge(1)
        ]
    );
}

export function sleepDart() {
    return new Card(
        'SleepDart',
        'Sleep Dart',
        'dart.png',
        new Resource(1, 0, {
            Growth: 1,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new SleepableUnit(),
        [new SleepTarget(3)]
    );
}

export function CreepingCorrosion() {
    return new Card(
        'CreepingCorrosion',
        'Creeping Corrosion',
        'poison-gas.png',
        new Resource(3, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new LifeLessUnits(4),
        [new PoisonTarget()]
    );
}

export function evolutionaryLeap() {
    return new Card(
        'EvolutionaryLeap',
        'Evolutionary Leap',
        'parmecia.png',
        new Resource(9, 0, {
            Growth: 6,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new UnitsOfTypeAsTarget(),
        [
            new BuffTarget(4, 4),
            new GrantAbility(Relentless),
            new GrantAbility(Flying),
            new GrantAbility(Venomous)
        ],
        'Give target unit and all units of the same type +4/+4, Relentless, Flying and Venomous.'
    );
}

export function fireElemental() {
    return new Unit(
        'FireElemental',
        'Flame Ifrit',
        'ifrit.png',
        UnitType.Elemental,
        new Resource(7, 0, {
            Growth: 4,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new AllOtherUnits(),
        8,
        4,
        [new DealDamage(3)]
    );
}

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
        5,
        5,
        []
    );
}

export function cobra() {
    return new Unit(
        'SnappingCobra',
        'Snapping Cobra',
        'cobra.png',
        UnitType.Snake,
        new Resource(2, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        2,
        [new Lethal()]
    );
}

export function greatWhale() {
    return new Unit(
        'GreatWhale',
        'Great Whale',
        'sperm-whale.png',
        UnitType.Mammal,
        new Resource(4, 0, {
            Growth: 5,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new UnitWithAbility('aquatic', 'Aquatic').setOptional(true),
        2,
        5,
        [new Aquatic(), new GainLife(2)]
    );
}

export function kraken() {
    return new Unit(
        'Kraken',
        'Shipwrecker Kraken',
        'giant-squid.png',
        UnitType.Monster,
        new Resource(7, 0, {
            Growth: 5,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new UnitWithAbility(Aquatic.getId(), 'Aquatic').setOptional(true),
        5,
        5,
        [new Aquatic(), new KillTarget()]
    );
}

export function tiger() {
    return new Unit(
        'ChargingTiger',
        'Charging Tiger',
        'tiger-head.png',
        UnitType.Mammal,
        new Resource(3, 0, {
            Growth: 2,
            Decay: 0,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3,
        2,
        [new Rush()]
    );
}

export function hydra() {
    return new Unit(
        'Hydra',
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
        5,
        5,
        [
            new Flying(),
            new Deathless(2),
            new BuffTarget(1, 1)
                .setTrigger(new DeathTrigger())
                .setTargeter(new SelfTarget())
        ]
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
        [
            new GainLife(2),
            new GainResource(
                new Resource(1, 1, {
                    Growth: 1,
                    Decay: 0,
                    Renewal: 0,
                    Synthesis: 0
                })
            )
        ],
        'You gain 1 growth, 1 energy and 2 life.'
    );
}

export function webspit() {
    return new Card(
        'Webspit',
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
        'Bite',
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
        new Resource(6, 0, {
            Growth: 3,
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
        4,
        5,
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
        1,
        1,
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
        new SelfTarget(),
        2,
        1,
        [new BuffTarget(0, 1).setTrigger(new Affinity())]
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
        new SelfTarget(),
        2,
        3,
        [new BuffTarget(1, 0).setTrigger(new Affinity())]
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
        1,
        1,
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
        3,
        3,
        [
            new BuffTarget(1, 0)
                .setTrigger(new Affinity())
                .setTargeter(new UnitsOfType(UnitType.Wolf))
        ]
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
        3,
        4,
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
        [new BuffTarget(2, 2), new GrantAbility(Relentless)]
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
        3,
        6,
        [new SummonUnits(venomousSpiderling, 1).setTrigger(new LethalStrike())]
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
        5,
        5,
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
        6,
        4,
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
