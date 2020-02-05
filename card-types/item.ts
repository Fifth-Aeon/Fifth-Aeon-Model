import { CardType, GameZone } from './card';
import { Game } from '../game';
import { EvalContext, Mechanic, TriggeredMechanic, EvalMap } from '../mechanic';
import { Permanent } from './permanent';
import { Resource } from '../resource';
import { Targeter } from '../targeter';
import { Unit } from './unit';

export class Item extends Permanent {
    private host: Unit | null = null;
    private lifeBonus: number;
    private damageBonus: number;
    private hostTargeter: Targeter;

    constructor(
        dataId: string,
        name: string,
        imageUrl: string,
        cost: Resource,
        targeter: Targeter,
        hostTargeter: Targeter,
        damageBonus: number,
        lifeBonus: number,
        mechanics: Mechanic[]
    ) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.lifeBonus = lifeBonus;
        this.damageBonus = damageBonus;
        this.hostTargeter = hostTargeter;
    }

    public evaluate(game: Game, context: EvalContext, evaluated: EvalMap) {
        return (
            this.lifeBonus +
            this.damageBonus +
            super.evaluate(game, EvalContext.Play, evaluated)
        );
    }

    public isPlayable(game: Game): boolean {
        return (
            super.isPlayable(game) &&
            this.hostTargeter.getValidTargets(this, game).length > 0
        );
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
        const host = this.hostTargeter.getUnitTargets(this, game)[0];
        this.attach(host, game);
    }

    public getText(game: Game, hasPrefix: boolean = true): string {
        const prefix = hasPrefix
            ? `Attaches to ${this.hostTargeter.getTextOrPronoun()}. `
            : '';
        return prefix + super.getText(game);
    }

    public attach(host: Unit, game: Game) {
        host.buff(this.damageBonus, this.lifeBonus);
        host.addItem(this);
        this.host = host;
        this.location = GameZone.Board;
        for (const mechanic of this.mechanics) {
            const clone = mechanic.clone();
            this.host.addMechanic(clone);
            clone.enter(host, game);
            if ((<TriggeredMechanic>clone).getTrigger) {
                (<TriggeredMechanic>clone).getTrigger().register(this, game);
                if (
                    (<TriggeredMechanic>clone).getTrigger().getId() === 'Play'
                ) {
                    (<TriggeredMechanic>clone).onTrigger(host, game);
                }
            }
        }
    }

    public detach(game: Game) {
        if (!this.host) {
            throw new Error('Cannot detach unattached item');
        }
        this.host.buff(-this.damageBonus, -this.lifeBonus);
        this.host.removeItem(this);
        for (const mechanic of this.mechanics) {
            this.host.removeMechanic(mechanic.getId(), game);
            mechanic.remove(this.host, game);
        }
        this.host = null;
        this.location = GameZone.Crypt;
    }
}
