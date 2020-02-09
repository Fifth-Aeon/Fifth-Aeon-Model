import { groupBy, sortBy, values } from 'lodash';
import { Game } from '../game';
import { Mechanic, UnitTargetedMechanic, TriggeredMechanic } from '../mechanic';
import { properList } from '../strings';
import { Spell } from './spell';
import { CardType } from '../cardType';
import { GameZone } from './card';

export class Permanent extends Spell {
    static cardTypes = new Set([CardType.Unit, CardType.Item]);

    public getText(game?: Game): string {
        if (this.text) {
            return this.text;
        }

        const displayedMechanics = this.mechanics.filter(mech => {
            const triggered = <TriggeredMechanic>mech;
            return !triggered.getTrigger || !triggered.getTrigger().isHidden();
        });

        const groups = values(
            groupBy(displayedMechanics, mech => {
                const triggered = <TriggeredMechanic>mech;
                if (triggered.getTrigger) {
                    return triggered.getTrigger().isHidden()
                        ? 'hidden'
                        : triggered.getTrigger().getId();
                }
                return '';
            })
        );

        return groups
            .map(mechanics => this.getMechanicGroupText(mechanics, game))
            .join(' ');
    }

    private getMechanicGroupText(mechanics: Mechanic[], game?: Game) {
        if (!(mechanics[0] instanceof TriggeredMechanic)) {
            return this.getSimpleMechanicGroupText(mechanics, game);
        }
        const trigger = (mechanics[0] as TriggeredMechanic).getTrigger();
        mechanics = sortBy(mechanics, this.getTargeterId);
        let lastId: string;
        const mechanicText = this.addSentenceMarkers(
            properList(
                mechanics.map(mechanic => {
                    const id = this.getTargeterId(mechanic);
                    if (id !== '') {
                        (mechanic as UnitTargetedMechanic)
                            .getTargeter()
                            .shouldUsePronoun(id === lastId);
                    }
                    lastId = id;
                    return this.removeSentenceMarkers(
                        mechanic.getText(this, game)
                    );
                })
            )
        );

        return trigger.getText(mechanicText);
    }

    private removeSentenceMarkers(text: string) {
        const first = text[0];
        const last = text[text.length - 1];
        const mid = text.substring(1, text.length - 1);
        return first.toLocaleLowerCase() + mid + (last === '.' ? '' : last);
    }

    private addSentenceMarkers(text: string) {
        const first = text[0];
        const mid = text.substring(1, text.length);
        return first.toLocaleUpperCase() + mid + '.';
    }

    private getTargeterId(mechanic: Mechanic) {
        if (!(mechanic instanceof UnitTargetedMechanic)) {
            return '';
        }
        return (mechanic as UnitTargetedMechanic).getTargeter().getId();
    }

    private getSimpleMechanicGroupText(mechanics: Mechanic[], game?: Game) {
        return mechanics
            .map(mechanic => mechanic.getText(this, game))
            .join(' ');
    }

    public leaveBoard(game: Game) {
        this.events.leavesPlay.trigger({ leavingUnit: this });
        this.mechanics.forEach(mechanic => {
            mechanic.remove(this, game);
        });
    }

    public die() {
        if (this.location !== GameZone.Board) {
            return;
        }
        this.events.death.trigger({});
        this.location = GameZone.Crypt;
    }

    public annihilate() {
        this.events.annihilate.trigger(new Map());
    }
}
