import { Game } from './game';
import { Player } from './player';
import { Card, Location } from './card';
import { Item } from './item';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic } from './mechanic';

export class Permanent extends Card {
    protected events: EventGroup = new EventGroup();

    public getEvents() {
        return this.events;
    }

    public leaveBoard(game: Game) {
        this.events.trigger(EventType.LeavesPlay, new Map([['leavingUnit', this]]));
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }
        
    public die() {
        if (this.location != Location.Board)
            return;
        this.events.trigger(EventType.Death, new Map());
        this.location = Location.Crypt;
    }
}