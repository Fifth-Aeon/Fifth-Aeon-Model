import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { properCase, properList } from '../../strings';


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
        return properList(this.abilities.map(ability => properCase(ability.id())));
    }

    public getText(card: Card) {
        if (this.abilities.length > 0)
            return `Give ${this.targeter.getText()} +${this.damage}/+${this.life} and ${this.abilityString()}.`
        return `Give ${this.targeter.getText()} +${this.damage}/+${this.life}.`
    }

    public evaluateTarget(owner: number, target: Unit) {
        return (this.life + this.damage) * 1.1 * (target.getOwner() == owner ? 1 : -1);
    }
}
