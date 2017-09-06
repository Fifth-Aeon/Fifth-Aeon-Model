import { remove, sortBy } from 'lodash';

import { Mechanic } from './mechanic';
import { Game } from './game';


export enum EventType {
    UnitEntersPlay, StartOfTurn, EndOfTurn,
    Death, UnitDies, Attack, TakeDamage, DealDamage, CheckBlock, KillUnit,
    LeavesPlay, Annihilate
}

export class GameEvent {
    public source: Mechanic | null;
    constructor(
        public type: EventType,
        public trigger: (params: (Map<string, any>)) => Map<string, any>,
        public priority: number = 5
    ) { }
}

export class EventGroup {
    private events: Map<EventType, Array<GameEvent>>

    constructor() {
        this.events = new Map<EventType, Array<GameEvent>>();
    }

    public getSubgroup(type:EventType) {
        let subgroup = new EventGroup();
        let events = this.events.get(type) || [];
        events.forEach(event => {
            subgroup.addEvent(event.source, event);
        })
        return subgroup;
    }

    public addEvent(source: Mechanic | null, event: GameEvent) {
        event.source = source;
        let events = this.events.get(event.type);
        if (!events) {
            this.events.set(event.type, []);
            events = this.events.get(event.type) || [];
        }
        events.push(event);
        events = sortBy(events, (event: GameEvent) => event.priority);
        event.source = source;
    }

    public trigger(type: EventType, params: Map<string, any>) {
        let events = this.events.get(type) || [];
        events.forEach(event => {
            params = event.trigger(params);
        })
        return params;
    }

    public removeEvents(source: Mechanic | null) {
        let allEvents = Array.from(this.events.values());
        allEvents.forEach(eventList => remove(eventList, event => {
            return event.source == source
        }))
    }
}
