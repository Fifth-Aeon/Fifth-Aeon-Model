import { remove, sortBy } from 'lodash';
import { Mechanic } from '../mechanic';
import { Trigger } from '../trigger';
import { AttackEvent, BlockEvent, DealDamageEvent, KillUnitEvent, TakeDamageEvent } from './cardEventTypes';
import { CheckBlockableEvent, CheckCanBlockEvent, EndOfTurnEvent, PlayerAttackedEvent,
    StartOfTurnEvent, UnitDiesEvent, UnitEntersPlayEvent } from './gameEventTypes';
import { CardDrawnEvent } from './playerEventTypes';

class AsyncGameEvent<T> {
    public source: Mechanic | Trigger | null;
    constructor(
        public trigger: (params: T) => Promise<any>,
        public priority: number = 5
    ) { }
}

class GameEvent<T> {
    public source: Mechanic | Trigger | null;
    constructor(
        public trigger: (params: T) => any,
        public priority: number = 5
    ) { }
}

abstract class EventList<T> {
    protected events: GameEvent<T>[] | AsyncGameEvent<T>[];

    public removeEvents(source: Mechanic | Trigger | null) {
        remove(this.events, event => {
            return event.source === source;
        });
    }
}


export class SyncEventList<T> extends EventList<T> {
    protected events: GameEvent<T>[] = [];

    public addEvent(source: Mechanic | Trigger |  null, callback: (params: T) => any, priority = 5) {
        let event = new GameEvent<T>(callback);
        event.source = source;
        event.priority = priority;
        this.events.push(event);
        this.events = sortBy(this.events, (ev: AsyncGameEvent<T>) => ev.priority);
        event.source = source;
    }

    public copy() {
        let copy = new SyncEventList<T>();
        copy.events = [...this.events];
        return copy;
    }

    public trigger(params: T) {
        let len = this.events.length;
        for (let i = 0; i < this.events.length; i++) {
            let event = this.events[i];
            event.trigger(params);
            if (this.events.length < len) {
                i -= (len - this.events.length);
                len = this.events.length;
            }
        }
        return params;
    }
}

export class AsyncEventList<T> extends EventList<T> {
    protected events: AsyncGameEvent<T>[] = [];

    public addEvent(source: Mechanic | Trigger |  null, callback: (params: T) => Promise<any>, priority = 5) {
        let event = new AsyncGameEvent<T>(callback);
        event.source = source;
        event.priority = priority;
        this.events.push(event);
        this.events = sortBy(this.events, (ev: AsyncGameEvent<T>) => ev.priority);
        event.source = source;
    }

    public copy() {
        let copy = new AsyncEventList<T>();
        copy.events = [...this.events];
        return copy;
    }

    public async trigger(params: T) {
        let len = this.events.length;
        for (let i = 0; i < this.events.length; i++) {
            let event = this.events[i];
            await event.trigger(params);
            if (this.events.length < len) {
                i -= (len - this.events.length);
                len = this.events.length;
            }
        }
        return params;
    }
}

abstract class EventSystem {
    protected eventLists: Array<EventList<any>>;
    public removeEvents(source: Mechanic | Trigger | null) {
        for (let eventList of this.eventLists)
            eventList.removeEvents(source);
    }
}

export class GameEventSystem extends EventSystem {
    unitEntersPlay = new AsyncEventList<UnitEntersPlayEvent>();
    startOfTurn = new AsyncEventList<StartOfTurnEvent>();
    endOfTurn = new AsyncEventList<EndOfTurnEvent>();
    playerAttacked = new AsyncEventList<PlayerAttackedEvent>();
    unitDies = new AsyncEventList<UnitDiesEvent>();

    eventLists = [this.unitEntersPlay, this.startOfTurn, this.endOfTurn, this.playerAttacked, this.unitDies];
}

export class CardEventSystem extends EventSystem  {
    play = new AsyncEventList();
    death = new AsyncEventList();
    unitDies = new AsyncEventList();
    attack = new AsyncEventList<AttackEvent>();
    block = new AsyncEventList<BlockEvent>();
    takeDamage = new AsyncEventList<TakeDamageEvent>();
    dealDamage = new AsyncEventList<DealDamageEvent>();
    checkBlockable = new SyncEventList<CheckBlockableEvent>();
    checkCanBlock = new SyncEventList<CheckCanBlockEvent>();
    killUnit = new AsyncEventList<KillUnitEvent>();
    leavesPlay = new AsyncEventList();
    annihilate = new AsyncEventList();

    eventLists = [
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

export class PlayerEventSystem   {
    CardDrawn = new AsyncEventList<CardDrawnEvent>();

    eventLists = [this.CardDrawn];
}
