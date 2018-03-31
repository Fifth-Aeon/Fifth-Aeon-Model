import { Mechanic, TargetedMechanic, TriggeredMechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, GameZone } from '../../card';
import { Unit, UnitType } from '../../unit';
import { Resource} from '../../resource';
import { GameEvent, EventType } from '../../gameEvent';

import { remove } from 'lodash';

export class GainLife extends TriggeredMechanic {
    protected static id = 'GainLife';
    constructor(private amount: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
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
    constructor(private resource: Resource = new Resource(1, 1)) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
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
