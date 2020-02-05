import { Card } from '../card-types/card';
import { Enchantment } from '../card-types/enchantment';
import { Item } from '../card-types/item';
import { Unit, UnitType } from '../card-types/unit';
import { Resource } from '../resource';
import { BuffTarget, GrantAbility } from './mechanics/buff';
import { CannotAttack, ImprisonTemporarily } from './mechanics/cantAttack';
import { DrawCard } from './mechanics/draw';
import { CannotBeEmpowered, Discharge } from './mechanics/enchantmentCounters';
import { RefreshTarget } from './mechanics/heal';
import { FriendlyLordship, UnitTypeLordshipInclusive, UnitTypeLordshipExclusive } from './mechanics/lordship';
import { MindControl } from './mechanics/mindControl';
import { GainLife } from './mechanics/playerAid';
import { CurePoison } from './mechanics/poison';
import { PreventAllDamage } from './mechanics/shieldEnchantments';
import { ShuffleIntoDeck } from './mechanics/shuffleIntoDeck';
import { Aquatic, Deathless, Flying, Ranged, Relentless, Rush } from './mechanics/skills';
import { SummonUnits } from './mechanics/summonUnits';
import { WinIfHighLife } from './mechanics/win';
import { AllUnits, FriendlyUnit, FriendlyUnits, SingleUnit, TriggeringUnit, Untargeted } from './targeters/basicTargeter';
import { RenewalMCTargeter } from './targeters/mindControlTargeter';
import { CurePoisonTargeter } from './targeters/poisonTargeter';
import { FriendlyUnitEntersPlay } from './triggers/basic';
import { Dawn } from './triggers/periodic';
import { Serenity } from './triggers/serenity';
import { Spell } from '../card-types/spell';

export function pegasus() {
    return new Unit(
        'Pegasus',
        'Pegasus',
        'pegasus.png',
        UnitType.Bird,
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new SingleUnit().setOptional(true),
        2,
        3,
        [new Flying(), new BuffTarget(0, 1), new GrantAbility(Flying)]
    );
}

export function dove() {
    return new Unit(
        'Dove',
        'Dove',
        'dove.png',
        UnitType.Bird,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        2,
        [new Flying(), new GainLife(2)]
    );
}

export function valiantDefenses() {
    return new Enchantment(
        'ValiantDefenses',
        'Valiant Defenses',
        'guards.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        3,
        3,
        [ new FriendlyLordship(0, 2)]
    );
}

export function supremeAgeis() {
    return new Enchantment(
        'SupremeAgeis',
        'Supreme Aegis',
        'rosa-shield.png',
        new Resource(7, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 6,
            Synthesis: 0
        }),
        new Untargeted(),
        10,
        4,
        [new Discharge(1), new CannotBeEmpowered(), new PreventAllDamage()]
    );
}

export function archer() {
    return new Unit(
        'Archer',
        'Archer',
        'bowman.png',
        UnitType.Soldier,
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        2,
        [new Ranged()]
    );
}

export function general() {
    return new Unit(
        'General',
        'Praetorian General',
        'galea.png',
        UnitType.Soldier,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        2,
        2,
        [new UnitTypeLordshipInclusive(UnitType.Soldier, 1, 1)]
    );
}

export function wingsOfLight() {
    return new Item(
        'WingsOfLight',
        'Wings Of Light',
        'angel-outfit.png',
        new Resource(7, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 5,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        5,
        5,
        [new Flying(), new Rush(), new Relentless()]
    );
}
export function navalGalley() {
    return new Unit(
        'NavalGalley',
        'Naval Galley',
        'trireme.png',
        UnitType.Vehicle,
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        2,
        3,
        [new Aquatic()]
    );
}

export function breastplate() {
    return new Item(
        'Breastplate',
        'Sturdy Breastplate',
        'breastplate.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        0,
        4,
        []
    );
}

export function crossbow() {
    return new Item(
        'Crossbow',
        'Crossbow',
        'crossbow.png',
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new Untargeted(),
        new FriendlyUnit(),
        2,
        2,
        [new Ranged()]
    );
}

export function ancientSage() {
    return new Unit(
        'AncientSage',
        'Sage of Tranquility',
        'meditation.png',
        UnitType.Cleric,
        new Resource(8, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 6,
            Synthesis: 0
        }),
        new Untargeted(),
        0,
        4,
        [
            new Deathless(),
            new CannotAttack(),
            new GainLife(2).setTrigger(new Serenity()),
            new DrawCard(1).setTrigger(new Serenity())
        ]
    );
}

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
        1,
        2,
        [new GainLife(1).setTrigger(new Serenity())]
    );
}

export function blacksmith() {
    return new Unit(
        'Blacksmith',
        'Blacksmith',
        'blacksmith.png',
        UnitType.Human,
        new Resource(2, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        1,
        1,
        [
            new BuffTarget(1, 0)
                .setTargeter(new TriggeringUnit())
                .setTrigger(new FriendlyUnitEntersPlay())
        ]
    );
}

export function kingUnit() {
    return new Unit(
        'King',
        'Regal Monarch',
        'throne-king.png',
        UnitType.Human,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new Untargeted(),
        3,
        5,
        [
            new UnitTypeLordshipInclusive(UnitType.Soldier, 1, 1),
            new SummonUnits(pikeman).setTrigger(new Dawn())
        ]
    );
}

export function imprison() {
    return new Enchantment(
        'Imprison',
        'Imprison',
        'dungeon-light.png',
        new Resource(3, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new SingleUnit(),
        4, 4,
        [new Discharge, new ImprisonTemporarily()]
    );
}

export function heal() {
    return new Spell(
        'Heal',
        'Heal',
        'caduceus.png',
        new Resource(1, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 1,
            Synthesis: 0
        }),
        new SingleUnit(),
        [new RefreshTarget(), new CurePoison()],
        'Refresh target unit. If that unit is poisoned, cure it.'
    );
}

export function gryphon() {
    return new Unit(
        'Gryphon',
        'Gryphon',
        'griffin-symbol.png',
        UnitType.Mammal,
        new Resource(4, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 2,
            Synthesis: 0
        }),
        new Untargeted(),
        2,
        4,
        [new Flying()]
    );
}

export function Dawnbreak() {
    return new Spell(
        'Dawnbreak',
        'Dawnbreak',
        'sunbeams.png',
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new FriendlyUnits(),
        [new RefreshTarget(), new BuffTarget(1, 3)],
        'Refresh all friendly units and give them +1/+3.'
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
        2,
        1,
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
        new SingleUnit(true),
        3,
        2,
        [new RefreshTarget()]
    );
}

export function monastery() {
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
        0,
        5,
        [
            new CannotAttack(),
            new SummonUnits(ruralMonk, 1).setTrigger(new Serenity())
        ]
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
        4,
        7,
        [new CannotAttack()]
    );
}

export function plagueDoctor() {
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
        2,
        3,
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
        3,
        3,
        []
    );
}

export function recruitment() {
    return new Spell(
        'Recruitment',
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

export function armistice() {
    return new Spell(
        'Armstice',
        'Armistice',
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
    return new Spell(
        'CallOfJustice',
        'Call of Justice',
        'scales.png',
        new Resource(5, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new RenewalMCTargeter(),
        [new MindControl()]
    );
}

export function angel() {
    return new Unit(
        'SentryAngel',
        'Angelic Protector',
        'angel-wings.png',
        UnitType.Cleric,
        new Resource(6, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 3,
            Synthesis: 0
        }),
        new Untargeted(),
        4,
        7,
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
        3,
        3,
        [new UnitTypeLordshipExclusive(UnitType.Cleric, 1, 1)]
    );
}

export function overwhelmingRadiance() {
    return new Spell(
        'OverwhelmingRadiance',
        'Overwhelming Radiance',
        'sun.png',
        new Resource(12, 0, {
            Growth: 0,
            Decay: 0,
            Renewal: 6,
            Synthesis: 0
        }),
        new FriendlyUnits(),
        [new WinIfHighLife(60)]
    );
}
