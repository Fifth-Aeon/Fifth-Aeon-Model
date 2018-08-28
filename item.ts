import { CardType, GameZone } from './card';
import { Game } from './game';
import { EvalContext, Mechanic, TriggeredMechanic } from './mechanic';
import { Permanent } from './permanent';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { Unit } from './unit';

export class Item extends Permanent {
    private host: Unit;
    private lifeBonus: number;
    private damageBonus: number;
    private hostTargeter: Targeter;

    constructor(dataId: string, name: string, imageUrl: string, cost: Resource, targeter: Targeter, hostTargeter: Targeter,
        damageBonus: number, lifeBonus: number, mechanics: Mechanic[]) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.lifeBonus = lifeBonus;
        this.damageBonus = damageBonus;
        this.hostTargeter = hostTargeter;
    }

    public evaluate(game: Game) {
        return this.lifeBonus + this.damageBonus + super.evaluate(game, EvalContext.Play);
    }

    public isPlayable(game: Game): boolean {
        return super.isPlayable(game) &&
            this.hostTargeter.getValidTargets(this, game).length > 0;
    }

    public getHostTargeter() {
        return this.hostTargeter;
    }

    public getHost() {
        return this.host;
    }

    public getDamage() {
        return this.damageBonus;
    }

    public getLife() {
        return this.lifeBonus;
    }

    public getStats() {
        return this.damageBonus + this.lifeBonus;
    }

    public getCardType() {
        return CardType.Item;
    }

    public play(game: Game) {
        let host = this.hostTargeter.getTargets(this, game, null)[0];
        this.attach(host, game);
    }

    public getText(game: Game, hasPrefix: boolean = true): string {
        let prefix = hasPrefix ? `Attaches to ${this.hostTargeter.getTextOrPronoun()}. ` : '';
        return prefix + super.getText(game);
    }

    public async attach(host: Unit, game: Game) {
        host.buff(this.damageBonus, this.lifeBonus);
        host.addItem(this);
        this.host = host;
        this.location = GameZone.Board;
        for (let mechanic of this.mechanics) {
            let clone = mechanic.clone();
            this.host.addMechanic(clone);
            clone.enter(host, game);
            if ((<TriggeredMechanic>clone).getTrigger) {
                (<TriggeredMechanic>clone).getTrigger().register(this, game);
                if ((<TriggeredMechanic>clone).getTrigger().getId() === 'Play') {
                    await (<TriggeredMechanic>clone).onTrigger(host, game);
                }
            }
        }
    }

    public detach(game: Game) {
        this.host.buff(-this.damageBonus, -this.lifeBonus);
        this.host.removeItem(this);
        for (let mechanic of this.mechanics) {
            this.host.removeMechanic(mechanic.getId(), game);
            mechanic.remove(this.host, game);
        }
        this.host = null;
        this.location = GameZone.Crypt;
    }
}
