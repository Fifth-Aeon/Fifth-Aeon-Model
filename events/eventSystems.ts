import { remove, sortBy } from 'lodash';
import { Mechanic } from '../mechanic';
import { Trigger } from '../trigger';
import {
    AttackEvent,
    BlockEvent,
    DealDamageEvent,
    KillUnitEvent,
    TakeDamageEvent
} from './cardEventTypes';
import {
    CheckBlockableEvent,
    CheckCanBlockEvent,
    EndOfTurnEvent,
    PlayerAttackedEvent,
    StartOfTurnEvent,
    UnitDiesEvent,
    UnitEntersPlayEvent
} from './gameEventTypes';
import { CardDrawnEvent } from './playerEventTypes';

class GameEvent<T> {
    public source: Mechanic | Trigger | undefined;
    constructor(
        public trigger: (params: T) => void,
        public priority: number = 5
    ) {}
}

export class EventList<T> {
    private events: GameEvent<T>[] = [];

    public addEvent(
        source: Mechanic | Trigger | undefined,
        callback: (params: T) => void,
        priority = 5
    ) {
        const event = new GameEvent<T>(callback);
        event.source = source;
        event.priority = priority;
        this.events.push(event);
        this.events = sortBy(this.events, (ev: GameEvent<T>) => ev.priority);
        event.source = source;
    }

    public copy() {
        const copy = new EventList<T>();
        copy.events = [...this.events];
        return copy;
    }

    public trigger(params: T) {
        let len = this.events.length;
        for (let i = 0; i < this.events.length && i >= 0; i++) {
            const event = this.events[i];
            event.trigger(params);
            if (this.events.length < len) {
                i -= len - this.events.length;
                len = this.events.length;
            }
        }
        return params;
    }

    public removeEvents(source: Mechanic | Trigger | null) {
        remove(this.events, event => {
            return event.source === source;
        });
    }
}

abstract class EventSystem {
    protected eventLists: Array<EventList<any>> = [];
    public removeEvents(source: Mechanic | Trigger | null) {
        for (const eventList of this.eventLists) {
            eventList.removeEvents(source);
        }
    }
}

export class GameEventSystem extends EventSystem {
    readonly unitEntersPlay = new EventList<UnitEntersPlayEvent>();
    readonly startOfTurn = new EventList<StartOfTurnEvent>();
    readonly endOfTurn = new EventList<EndOfTurnEvent>();
    readonly playerAttacked = new EventList<PlayerAttackedEvent>();
    readonly unitDies = new EventList<UnitDiesEvent>();

    readonly eventLists = [
        this.unitEntersPlay,
        this.startOfTurn,
        this.endOfTurn,
        this.playerAttacked
    ];
}

export class CardEventSystem extends EventSystem {
    readonly play = new EventList();
    readonly death = new EventList();
    readonly unitDies = new EventList();
    readonly attack = new EventList<AttackEvent>();
    readonly block = new EventList<BlockEvent>();
    readonly takeDamage = new EventList<TakeDamageEvent>();
    readonly dealDamage = new EventList<DealDamageEvent>();
    readonly checkBlockable = new EventList<CheckBlockableEvent>();
    readonly checkCanBlock = new EventList<CheckCanBlockEvent>();
    readonly killUnit = new EventList<KillUnitEvent>();
    readonly leavesPlay = new EventList();
    readonly annihilate = new EventList();

    readonly eventLists = [
        this.play,
        this.death,
        this.unitDies,
        this.attack,
        this.block,
        this.takeDamage,
        this.dealDamage,
        this.checkBlockable,
        this.checkCanBlock,
        this.killUnit,
        this.leavesPlay,
        this.annihilate
    ];
}

export class PlayerEventSystem {
    readonly CardDrawn = new EventList<CardDrawnEvent>();

    readonly eventLists = [this.CardDrawn];
}
