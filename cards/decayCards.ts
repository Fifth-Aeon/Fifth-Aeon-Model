import { Card } from '../card';
import { CardType } from '../cardType';
import { Enchantment } from '../enchantment';
import { Item } from '../item';
import { Resource } from '../resource';
import { Unit, UnitType } from '../unit';
import { BuffTarget, BuffTargetAndGrant, GrantAbility } from './mechanics/buff';
import { CannotAttack } from './mechanics/cantAttack';
import { DamageSpawnOnKill, DealDamage } from './mechanics/dealDamage';
import {
    AbominationConsume,
    TransformDamaged
} from './mechanics/decaySpecials';
import { Discard, DiscardOnDamage } from './mechanics/draw';
import { Discharge } from './mechanics/enchantmentCounters';
import { notUnitLordship, unitTypeLordshipAll } from './mechanics/lordship';
import { PoisonImmune, PoisonTarget } from './mechanics/poison';
import { KillTarget } from './mechanics/removal';
import { ReturnFromCrypt } from './mechanics/returnFromCrypt';
import { DeathCounter } from './mechanics/shieldEnchantments';
import {
    Aquatic,
    Deathless,
    Flying,
    Immortal,
    Lethal,
    Lifesteal,
    Relentless,
    Rush
} from './mechanics/skills';
import {
    SummonUnitForGrave,
    SummonUnitOnDamage,
    SummonUnits
} from './mechanics/summonUnits';
import {
    AllOtherUnits,
    EnemyPlayer,
    EnemyUnit,
    FriendlyUnit,
    OwningPlayer,
    SelfTarget,
    SingleUnit,
    Untargeted
} from './targeters/basicTargeter';
import { PoisonableUnit } from './targeters/poisonTargeter';
import {
    FriendlyUnitsOfType,
    UnitsNotOfType
} from './targeters/unitTypeTargeter';
import { DamagedUnit } from './targeters/weakenedUnits';
import { DeathTrigger, SoulReap } from './triggers/death';
import { LethalStrike } from './triggers/lethalStrike';
import { Dusk } from './triggers/periodic';

export function imp() {
    return new Unit(
        'Imp',
        'Imp',
        'imp.png',
        UnitType.Demon,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        1,
        [new Flying()]
    );
}

export function gargoyle() {
    return new Unit(
        'GargoyleSentry',
        'Gargoyle Sentry',
        'gargoyle.png',
        UnitType.Monster,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4,
        4,
        [new Flying(), new CannotAttack()]
    );
}

export function tombGuardian() {
    return new Unit(
        'TombGuardian',
        'Tomb Guardian',
        'mummy-head.png',
        UnitType.Undead,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        2,
        [new Deathless(), new Lethal()]
    );
}

export function abyssalVengeance() {
    return new Enchantment(
        'AbyssalShield',
        'Abyssal Shield',
        'skull-shield.png',
        new Resource(7, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        8,
        4,
        [new DeathCounter()]
    );
}

export function deathAscendancy() {
    return new Enchantment(
        'DeathAscendancy',
        'Death’s Ascendancy',
        'reaper-scythe.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        3,
        4,
        [
            new Discharge(1),
            unitTypeLordshipAll(UnitType.Undead, 1, 1),
            notUnitLordship(UnitType.Undead, -1, -1)
        ]
    );
}

export function unyieldingNightmare() {
    return new Enchantment(
        'UnyieldingNightmare',
        'Unyielding Nightmare',
        'evil-moon.png',
        new Resource(12, 0, {
            Growth: 0,
            Decay: 6,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        5,
        3,
        [
            new Discharge(1),
            new GrantAbility(Deathless).setTargeter(
                new FriendlyUnitsOfType(UnitType.Undead)
            ),
            new KillTarget()
                .setTargeter(new UnitsNotOfType(UnitType.Undead))
                .setTrigger(new Dusk())
        ]
    );
}

export function impKeep() {
    return new Enchantment(
        'InfestedKeep',
        'Infested Keep',
        'castle-ruins.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4,
        2,
        [
            new SummonUnits(imp).setTrigger(new Dusk()),
            new DealDamage(1)
                .setTargeter(new OwningPlayer())
                .setTrigger(new Dusk())
        ]
    );
}

export function raider() {
    return new Unit(
        'Raider',
        'Raider',
        'horned-helm.png',
        UnitType.Human,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2,
        2,
        [new Rush()]
    );
}

export function raidShip() {
    return new Unit(
        'RaidingShip',
        'Raid Ship',
        'drakkar.png',
        UnitType.Vehicle,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        2,
        2,
        [new Aquatic(), new Rush(), new SummonUnitOnDamage(raider)]
    );
}

export function whip() {
    return new Item(
        'WhipOfTorment',
        'Whip of Torment',
        'whip.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new EnemyUnit(),
        new FriendlyUnit(),
        3,
        0,
        [new BuffTargetAndGrant(-1, -1, [])]
    );
}

export function NecromancerStaff() {
    return new Item(
        'Necromancers Staff',
        'Necromancer’s Staff',
        'skull-staff.png',
        new Resource(7, 0, {
            Growth: 0,
            Decay: 5,
            Renewal: 0,
            Synthesis: 0
        }),
        new EnemyUnit(),
        new FriendlyUnit(),
        1,
        3,
        [new Lethal(), new DealDamage(1)]
    );
}

export function assasinsDagger() {
    return new Item(
        'AssasinDagger',
        'Assassin’s dagger',
        'dripping-blade.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        1,
        1,
        [new Lethal()]
    );
}

export function NecromancerTome() {
    return new Item(
        'NecromancerTome',
        'Necromancer’s Tome',
        'evil-book.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        4,
        0,
        [new Deathless()]
    );
}

export function reaper() {
    return new Unit(
        'Reaper',
        'Reaper',
        'grim-reaper.png',
        UnitType.Undead,
        new Resource(8, 0, {
            Growth: 0,
            Decay: 6,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        1,
        [new Immortal(), new Lethal(), new Relentless(), new PoisonImmune()]
    );
}

export function specter() {
    return new Unit(
        'Spectre',
        'Spectre',
        'spectre.png',
        UnitType.Undead,
        new Resource(7, 0, {
            Growth: 0,
            Decay: 5,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        5,
        3,
        [new Flying(), new Deathless(), new DiscardOnDamage()]
    );
}

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
        1,
        1,
        [new Deathless()]
    );
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
        4,
        4,
        [
            new Deathless(),
            new BuffTarget(1, 1)
                .setTargeter(new SelfTarget())
                .setTrigger(new SoulReap())
        ]
    );
}

export function cruelTyrant() {
    return new Unit(
        'CruelTyrant',
        'Cruel Tyrant',
        'overlord-helm.png',
        UnitType.Human,
        new Resource(7, 0, {
            Growth: 0,
            Decay: 4,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4,
        6,
        [
            new Lifesteal(),
            new DealDamage(1)
                .setTargeter(new EnemyPlayer())
                .setTrigger(new SoulReap())
        ]
    );
}

export function lichring() {
    return new Item(
        'LichRing',
        'Lich’s Ring',
        'skull-signet.png',
        new Resource(2, 0, {
            Growth: 0,
            Decay: 2,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        1,
        0,
        [
            new BuffTarget(1, 1)
                .setTargeter(new SelfTarget())
                .setTrigger(new SoulReap())
        ]
    );
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
        'RaiseSkeletons',
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

export function toxin() {
    return new Card(
        'Toxin',
        'Toxin',
        'death-juice.png',
        new Resource(2, 0, {
            Growth: 0,
            Decay: 1,
            Renewal: 0,
            Synthesis: 0
        }),
        new PoisonableUnit(),
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
        2,
        1,
        []
    );
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
        2,
        2,
        [new SummonUnits(crawlingZombie, 1).setTrigger(new DeathTrigger())]
    );
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
    );
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
        2,
        2,
        [new Discard(1)]
    );
}

export function abomination() {
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
        0,
        1,
        [new AbominationConsume()]
    );
}

export function assassin() {
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
        new PoisonableUnit().setOptional(true),
        2,
        2,
        [new PoisonTarget(), new Lethal()]
    );
}

export function vampire() {
    return new Unit(
        'Vampire',
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
        3,
        3,
        [
            new BuffTarget(1, 1)
                .setTrigger(new LethalStrike())
                .setTargeter(new SelfTarget())
        ]
    );
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
        1,
        2,
        [new Flying(), new Lifesteal()]
    );
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
        4,
        4,
        [new PoisonTarget()]
    );
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
        0,
        1,
        [new CannotAttack()]
    );
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
        3,
        7,
        [new TransformDamaged(statue)]
    );
}

export function unbury() {
    return new Card(
        'Unbury',
        'Unearth',
        'coffin.png',
        new Resource(0, 0, {
            Growth: 0,
            Decay: 3,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        [new ReturnFromCrypt(CardType.Unit)]
    );
}
