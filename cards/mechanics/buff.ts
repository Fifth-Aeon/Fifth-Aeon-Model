import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { properCase, properList } from '../../strings';

export class BuffTarget extends TargetedMechanic {
    constructor(private damage: number, private life: number) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        for (let target of this.targeter.getTargets(card, game)) {
            target.buff(this.damage, this.life);
        }
    }

    private symbol(number: number) {
        return number > 0 ? '+' : '';
    }

    public getText(card: Card) {
        let buffText = `${this.symbol(this.damage)}${this.damage}/${this.symbol(this.life)}${this.life}`
        return `Give ${this.targeter.getText()} ${buffText}.`
    }

    public evaluateTarget(source: Card, target: Unit) {
        return (this.life + this.damage) * 1.1 * (target.getOwner() === source.getOwner() ? 1 : -1);
    }
}

export class BuffTargetAndGrant extends TargetedMechanic {
    constructor(private damage: number, private life: number, private abilities: Mechanic[]) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
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

    private symbol(number: number) {
        return number > 0 ? '+' : '';
    }

    public getText(card: Card) {
        let buffText = `${this.symbol(this.damage)}${this.damage}/${this.symbol(this.life)}${this.life}`
        if (this.abilities.length > 0)
            return `Give ${this.targeter.getText()} ${buffText} and ${this.abilityString()}.`
        return `Give ${this.targeter.getText()} ${buffText}.`
    }

    public evaluateTarget(source: Card, target: Unit) {
        return (this.life + this.damage) * 1.1 * (target.getOwner() === source.getOwner() ? 1 : -1);
    }
}



