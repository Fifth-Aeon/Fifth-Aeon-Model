import { Game } from './game';
import { Player } from './player';
import { Card, GameZone, CardType } from './card';
import { Item } from './item';
import { EventGroup, EventType } from './gameEvent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic, TriggeredMechanic, TargetedMechanic } from './mechanic';

import { groupBy, values } from 'lodash';

export class Permanent extends Card {
    static cardTypes = new Set([CardType.Unit, CardType.Item]);

    public getText(game: Game): string {
        if (this.text)
            return this.text;
        let text = '';
        let groups = values(groupBy(this.mechanics, (mech) => {
            const triggered = <TriggeredMechanic>mech;
            if (triggered.getTrigger) {
                return triggered.getTrigger().isHidden() ? 'hidden' : triggered.getTrigger().getId();
            }
            return '';
        }));

        return groups.map(mechanics => this.getTriggerGroupText(mechanics, game)).join(' ');
    }

    private getTriggerGroupText(mechanics: Mechanic[], game: Game) {
        const mechanicText = mechanics
            .map(mechanic => mechanic.getText(this, game))
            .join(' ');
        const first = mechanics[0];
        if (!(first instanceof TriggeredMechanic))
            return mechanicText;
        const trigger = (first as TriggeredMechanic).getTrigger();
        return trigger.getText(mechanicText);

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
