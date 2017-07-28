import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted, AllUnits, AllUnitsOtherUnits } from '../targeter';
import { PoisonTarget } from './mechanics/poison';
import { Resource } from '../resource';

export function princeOfDecay() {
    let unit = new Unit(
        'PriceOfDecay',
        'Price of Decay',
        'necrosis.png',
        UnitType.Spider,
        new Resource(8, 0, {
            Growth: 0,
            Necrosis: 6,
            Renewal: 0,
            Synthesis: 0
        }),
        new Untargeted(),
        4, 4,
        []
    )
    unit.addMechanic(new PoisonTarget(new AllUnitsOtherUnits(unit)), null);

    return unit;
}

