import { Unit } from '../unit';
import { Card } from '../card';

export interface DealDamageEvent {
    source: Card;
    target: Unit;
    amount: number;
}

export interface BlockEvent {
    attacker: Unit;
}

export interface AttackEvent {
    blocker: Unit;
}
