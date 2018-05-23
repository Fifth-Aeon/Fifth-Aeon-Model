import { Mechanic, TargetedMechanic } from '../../mechanic';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { properCase, properList } from '../../strings';
import { ParameterType } from '../parameters';


export class BuffTarget extends TargetedMechanic {
    protected static id = 'BuffTarget';
    protected static ParameterTypes = [
        { name: 'damage', type: ParameterType.Integer },
        { name: 'life', type: ParameterType.Integer }
    ];

    constructor(private damage: number = 1, private life: number = 1) {
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
        let buffText = `${this.symbol(this.damage)}${this.damage}/${this.symbol(this.life)}${this.life}`;
        return `Give ${this.targeter.getTextOrPronoun()} ${buffText}.`;
    }

    public evaluateTarget(source: Card, target: Unit) {
        return (this.life + this.damage) * 1.1 * (target.getOwner() === source.getOwner() ? 1 : -1);
    }
}

export class BuffTargetAndGrant extends TargetedMechanic {
    protected static id = 'BuffTargetAndGrant';
    constructor(private damage: number = 1, private life: number = 1, private abilities: Mechanic[] = []) {
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
        return properList(this.abilities.map(ability => properCase(ability.getId())));
    }

    private symbol(number: number) {
        return number > 0 ? '+' : '';
    }

    public getText(card: Card) {
        let buffText = `${this.symbol(this.damage)}${this.damage}/${this.symbol(this.life)}${this.life}`;
        if (this.abilities.length > 0)
            return `Give ${this.targeter.getTextOrPronoun()} ${buffText} and ${this.abilityString()}.`;
        return `Give ${this.targeter.getTextOrPronoun()} ${buffText}.`;
    }

    public evaluateTarget(source: Card, target: Unit) {
        return (this.life + this.damage) * 1.1 * (target.getOwner() === source.getOwner() ? 1 : -1);
    }
}



