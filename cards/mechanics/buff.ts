import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';


export class BuffTarget extends TargetedMechanic {
    constructor(private damage: number, private life: number, private abilities: Mechanic[]) {
        super();
    }
    public run(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.buff(this.damage, this.life);
            for (let ability of this.abilities) {
                target.addMechanic(ability, game);
            }
        }
    }

    private abilityString() {
        return this.abilities.map(ability => ability.id()).join(', ');
    }
    public getText(card: Card) {
        return `Give ${this.targeter.getText()} +${this.damage}/+${this.life} and ${this.abilityString()}.`
    }
}
