import { Unit } from '../unit';
import { Card } from '../card';

export interface UnitEntersPlayEvent {
    enteringUnit: Unit;
}

export interface StartOfTurnEvent {
    player: number;
}

export interface EndOfTurnEvent {
    player: number;
}

export interface PlayerAttackedEvent {
    /** The player number of the attacked player */
    target: number;
}

export interface UnitDiesEvent {
    deadUnit: Unit;
}

export interface CheckCanBlockEvent {
    attacker: Unit;
    canBlock: boolean;
}

export interface CheckBlockableEvent {
    blocker: Unit;
    canBlock: boolean;
}



