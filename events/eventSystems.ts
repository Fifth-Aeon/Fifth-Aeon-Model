import { remove, sortBy } from 'lodash';
import { Mechanic } from '../mechanic';
import { Trigger } from '../trigger';
import { AttackEvent, BlockEvent, DealDamageEvent, KillUnitEvent, TakeDamageEvent } from './cardEventTypes';
import { CheckBlockableEvent, CheckCanBlockEvent, EndOfTurnEvent, PlayerAttackedEvent,
    StartOfTurnEvent, UnitDiesEvent, UnitEntersPlayEvent } from './gameEventTypes';
import { CardDrawnEvent } from './playerEventTypes';

class GameEvent<T> {
    public source: Mechanic | Trigger | null;
    constructor(
        public trigger: (params: T) => Promise<any>,
        public priority: number = 5
    ) { }
}

export class EventList<T> {
    private events: GameEvent<T>[] = [];

    public addEvent(source: Mechanic | Trigger |  null, callback: (params: T) => Promise<any>, priority = 5) {
        let event = new GameEvent<T>(callback);
        event.source = source;
        event.priority = priority;
        this.events.push(event);
        this.events = sortBy(this.events, (ev: GameEvent<T>) => ev.priority);
        event.source = source;
    }

    public copy() {
        let copy = new EventList<T>();
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
    play = new EventList();
    death = new EventList();
    unitDies = new EventList();
    attack = new EventList<AttackEvent>();
    block = new EventList<BlockEvent>();
    takeDamage = new EventList<TakeDamageEvent>();
    dealDamage = new EventList<DealDamageEvent>();
    checkBlockable = new EventList<CheckBlockableEvent>();
    checkCanBlock = new EventList<CheckCanBlockEvent>();
    killUnit = new EventList<KillUnitEvent>();
    leavesPlay = new EventList();
    annihilate = new EventList();

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
    CardDrawn = new EventList<CardDrawnEvent>();

    eventLists = [this.CardDrawn];
}
