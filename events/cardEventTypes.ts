import { Unit } from '../card-types/unit';
import { Card } from '../card-types/card';

export interface DealDamageEvent {
    source: Card;
    target: Unit;
    amount: number;
}

export interface BlockEvent {
    attacker: Unit;
}

export interface AttackEvent {
    damage: number;
    attacker: Unit;
    defender: Unit;
}

export interface TakeDamageEvent {
    target: Unit;
    source: Card;
    amount: number;
}

export interface KillUnitEvent {
    source: Card;
    target: Unit;
}
