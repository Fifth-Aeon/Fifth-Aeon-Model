import { Mechanic } from '../mechanic';
import { Card } from '../card';
import { Unit, UnitType } from '../unit';
import { SingleUnit, Untargeted } from '../targeter';
import { DealDamage } from './mechanics/dealDamage';
import { Resource } from '../resource';


export function makeDamageCard() {
    let targeter = new SingleUnit();
    return new Card(
        'DamageCard',
        'Test Spell',
        'decay-icon.png',
        new Resource(1),
        targeter,
        [new DealDamage(1, targeter)]
    )
}

export function makeBasicUnit() {
    return new Unit(
        'BasicUnit',
        'Test Unit',
        'growth.png',
        UnitType.Automaton,
        new Resource(1),
        new Untargeted(),
        2, 2,
        []
    )
}
