import { Card } from '../../card';
import { Game } from '../../game';
import { TriggeredMechanic } from '../../mechanic';
import { Resource } from '../../resource';
import { ParameterType } from '../parameters';


export class GainLife extends TriggeredMechanic {
    protected static id = 'GainLife';
    protected static ParameterTypes = [
        { name: 'Amount', type: ParameterType.Integer }
    ];

    constructor(private amount: number = 1) {
        super();
    }

    public async onTrigger(card: Card, game: Game) {
        let player = game.getPlayer(card.getOwner());
        player.addLife(this.amount);
    }

    public getText(card: Card) {
        return `You gain ${this.amount} life.`;
    }

    public evaluateEffect() {
        return this.amount * 0.75;
    }
}

export class GainResource extends TriggeredMechanic {
    protected static id = 'GainResource';
    protected static ParameterTypes = [
        { name: 'Resource', type: ParameterType.Resource }
    ];

    constructor(private resource: Resource = new Resource(1, 1)) {
        super();
    }

    public async onTrigger(card: Card, game: Game) {
        let player = game.getPlayer(card.getOwner());
        player.getPool().add(this.resource);
    }

    public getText(card: Card) {
        return `Gain ${this.resource.asListDesc()}.`;
    }

    public evaluateEffect() {
        return this.resource.getNumeric() * 2;
    }
}
