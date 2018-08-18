import { sortBy, remove } from 'lodash';
import { Mechanic } from '../mechanic';
import { Trigger } from '../trigger';
import { UnitEntersPlayEvent, StartOfTurnEvent, EndOfTurnEvent, PlayerAttackedEvent, UnitDiesEvent } from './gameEventTypes';
import { DealDamageEvent, BlockEvent, AttackEvent } from './cardEventTypes';

class GameEvent<T> {
    public source: Mechanic | Trigger | null;
    constructor(
        public trigger: (params: T) => void,
        public priority: number = 5
    ) { }
}

class EventList<T> {
    private events: GameEvent<T>[] = [];

    public addEvent(source: Mechanic | Trigger |  null, callback: (params: T) => void) {
        let event = new GameEvent<T>(callback);
        event.source = source;
        this.events.push(event);
        this.events = sortBy(this.events, (ev: GameEvent<T>) => ev.priority);
        event.source = source;
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

    public removeEvents(source: Mechanic | Trigger | null) {
        remove(this.events, event => {
            return event.source === source;
        });
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
    unitEntersPlay = new EventList<UnitEntersPlayEvent>();
    startOfTurn = new EventList<StartOfTurnEvent>();
    endOfTurn = new EventList<EndOfTurnEvent>();
    playerAttacked = new EventList<PlayerAttackedEvent>();
    unitDies = new EventList<UnitDiesEvent>();

    eventLists = [this.unitEntersPlay, this.startOfTurn, this.endOfTurn, this.playerAttacked];
}

export class CardEventSystem extends EventSystem  {
    playEvents = new EventList();
    DeathEvents = new EventList();
    UnitDiesEvents = new EventList();
    AttackEvents = new EventList<AttackEvent>();
    BlockEvents = new EventList<BlockEvent>();
    TakeDamageEvents = new EventList();
    DealDamageEvents = new EventList<DealDamageEvent>();
    CheckBlockableEvents = new EventList();
    CheckCanBlockEvents = new EventList();
    KillUnitEvents = new EventList();
    LeavesPlayEvents = new EventList();
    AnnihilateEvents = new EventList();

    eventLists = [
        this.playEvents, this.DeathEvents, this.UnitDiesEvents,
        this.AttackEvents, this.BlockEvents, this.TakeDamageEvents,
        this.DealDamageEvents, this.CheckBlockableEvents, this.CheckCanBlockEvents,
        this.KillUnitEvents, this.LeavesPlayEvents, this.AnnihilateEvents
    ];
}
