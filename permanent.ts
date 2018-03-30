import { Game } from './game';
import { Player } from './player';
import { Card, GameZone, CardType } from './card';
import { Item } from './item';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic, TriggeredMechanic } from './mechanic';

import { groupBy } from 'lodash';

export class Permanent extends Card {
    static cardTypes = new Set([CardType.Unit, CardType.Item]);

    public getText(game: Game): string {
        if (this.text)
            return this.text;
        let text = '';
        let groups = groupBy(this.mechanics, (mech) => {
            const triggered = <TriggeredMechanic>mech;
            if (triggered.getTrigger) {
                return triggered.getTrigger().isHidden() ? 'hidden' : triggered.getTrigger().getName();
            }
            return '';
        });
        let first = true;
        for (let trigger in groups) {
            if (trigger === 'hidden')
                continue;
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
