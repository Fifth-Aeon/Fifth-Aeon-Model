import { Game } from './game';
import { Player } from './player';
import { Card, GameZone, CardType } from './card';
import { Item } from './item';

import { Resource } from './resource';
import { Targeter } from './targeter';
import { Mechanic, TriggeredMechanic, TargetedMechanic } from './mechanic';

import { groupBy, values, sortBy } from 'lodash';
import { properList } from './strings';

export class Permanent extends Card {
    static cardTypes = new Set([CardType.Unit, CardType.Item]);

    public getText(game: Game): string {
        if (this.text)
            return this.text;

        const displayedMechanics = this.mechanics.filter(mech => {
            const triggered = <TriggeredMechanic>mech;
            return !triggered.getTrigger || !triggered.getTrigger().isHidden();
        });

        let groups = values(groupBy(displayedMechanics, (mech) => {
            const triggered = <TriggeredMechanic>mech;
            if (triggered.getTrigger) {
                return triggered.getTrigger().isHidden() ? 'hidden' : triggered.getTrigger().getId();
            }
            return '';
        }));

        return groups.map(mechanics => this.getMechanicGroupText(mechanics, game)).join(' ');
    }

    private getMechanicGroupText(mechanics: Mechanic[], game: Game) {
        if (!(mechanics[0] instanceof TriggeredMechanic))
            return this.getSimpleMechanicGroupText(mechanics, game);
        const trigger = (mechanics[0] as TriggeredMechanic).getTrigger();
        mechanics = sortBy(mechanics, this.getTargeterId);
        let lastId: string = null;
        const mechanicText = this.addSentanceMarkers(properList(mechanics.map(mechanic => {
            let id = this.getTargeterId(mechanic);
            if (id !== '')
                (mechanic as TargetedMechanic).getTargeter().shouldUsePronoun(id === lastId);
            lastId = id;
            return this.removeSentanceMarkers(mechanic.getText(this, game));
        })));

        return trigger.getText(mechanicText);
    }

    private removeSentanceMarkers(text: string) {
        const first = text[0];
        const last = text[text.length - 1];
        const mid = text.substring(1, text.length - 1);
        return first.toLocaleLowerCase() + mid + (last === '.' ? '' : last);
    }

    private addSentanceMarkers(text: string) {
        const first = text[0];
        const mid = text.substring(1, text.length);
        return first.toLocaleUpperCase() + mid + '.';
    }

    private getTargeterId(mechanic: Mechanic) {
        if (!(mechanic instanceof TargetedMechanic))
            return '';
        return (mechanic as TargetedMechanic).getTargeter().getId();
    }

    private getSimpleMechanicGroupText(mechanics: Mechanic[], game: Game) {
        return mechanics
            .map(mechanic => mechanic.getText(this, game))
            .join(' ');
    }

    public leaveBoard(game: Game) {
        this.events.LeavesPlay.trigger({leavingUnit: this});
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    public die() {
        if (this.location !== GameZone.Board)
            return;
        this.events.Death.trigger({});
        this.location = GameZone.Crypt;
    }
}
