import { Game } from './game';
import { Player } from './player';
import { Card, GameZone } from './card';
import { Item } from './item';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic, TriggeredMechanic } from './mechanic';

import { groupBy } from 'lodash';

export class Permanent extends Card {

    public getText(game: Game): string {
        if (this.text)
            return this.text;
        let text = '';
        let groups = groupBy(this.mechanics, (mech) => {
            if ((<TriggeredMechanic>mech).getTrigger) {
                return (<TriggeredMechanic>mech).getTrigger().getName();
            }
            return '';
        });
        let first = true;
        for (let trigger in groups) {
            if (!first) {
                text += ' ';
            }
            first = false;
            if (trigger !== '')
                text += trigger + ': ';
            text += groups[trigger].map(mechanic => mechanic.getText(this, game)).join(' ');
        }
        return text;
    }

    public leaveBoard(game: Game) {
        this.events.trigger(EventType.LeavesPlay, new Map([['leavingUnit', this]]));
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    public die() {
        if (this.location !== GameZone.Board)
            return;
        this.events.trigger(EventType.Death, new Map());
        this.location = GameZone.Crypt;
    }
}
