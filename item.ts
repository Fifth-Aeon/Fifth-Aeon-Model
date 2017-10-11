import { Card, CardType } from './card';
import { Unit } from './unit';
import { Mechanic } from './mechanic';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { EventGroup } from './gameEvent';
import { Game } from './game';

export class Item extends Card {
    private host: Unit;
    private lifeBonus: number;
    private damageBonus: number;
    private events: EventGroup;
    private hostTargeter: Targeter;

    constructor(dataId: string, name: string, imageUrl: string, cost: Resource, targeter: Targeter, hostTargeter: Targeter,
        lifeBonus: number, damageBonus: number, mechanics: Mechanic[]) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.lifeBonus = lifeBonus;
        this.damageBonus = damageBonus;
        this.hostTargeter = hostTargeter;
    }

    public isPlayable(game: Game): boolean {
        return super.isPlayable(game) &&
            this.hostTargeter.getValidTargets(this, game).length > 0;
    }

    public getHostTargeter() {
        return this.hostTargeter;
    }

    public getCardType() {
        return CardType.Item;
    }

    public play(game: Game) {
        let host = this.hostTargeter.getTargets(this, game)[0];
        this.attach(host);
        for (let mechanic of this.mechanics) {
            host.addMechanic(mechanic);
            mechanic.run(host, game);
        }
    }

    public attach(unit: Unit) {
        unit.buff(this.damageBonus, this.lifeBonus);
        unit.addItem(this);
        this.host = unit;
    }

    public detach() {
        this.host.buff(-this.damageBonus, -this.lifeBonus);
        this.host.removeItem(this);
        this.host = null;
    }


}