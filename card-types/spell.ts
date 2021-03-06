
import { CardEventSystem } from '../events/eventSystems';
import { Game } from '../game';
import {
    EvalContext,
    Mechanic,
    TriggeredMechanic,
    EvalMap,
    TargetedMechanic
} from '../mechanic';
import { Resource } from '../resource';
import { Targeter } from '../targeter';
import { Unit } from './unit';
import { Card, GameZone, CardType } from './card';
// import { Permanent } from './permanent';





export class Spell implements Card {
    protected name: string;
    protected id: string;
    protected mechanics: Mechanic[] = [];

    protected cost: Resource;
    protected owner = -1;
    protected dataId: string;
    protected imageUrl: string;
    protected location: GameZone;
    protected text?: string;
    protected events = new CardEventSystem();

    protected targeter: Targeter;

    constructor(
        dataId: string,
        name: string,
        imageUrl: string,
        cost: Resource,
        targeter: Targeter,
        mechanics: Array<Mechanic>,
        text?: string
    ) {
        this.dataId = dataId;
        this.name = name;
        this.imageUrl = imageUrl;
        this.cost = cost;
        this.targeter = targeter;
        this.mechanics = mechanics;
        this.mechanics.forEach(mechanic => mechanic.attach(this));
        this.location = GameZone.Deck;
        this.id = this.generateId();
        this.text = text;
    }

    /**
     * Returns the cards event system.
     * This is used to add or remove events
     */
    public getEvents() {
        return this.events;
    }

    private generateId(): string {
        return Math.random()
            .toString(16)
            .substring(2);
    }

    public getCardType(): CardType {
        return CardType.Spell;
    }

    public setText(text: string) {
        this.text = text;
    }

    public setLocation(location: GameZone) {
        this.location = location;
    }

    public getLocation() {
        return this.location;
    }

    public draw() {
        this.location = GameZone.Hand;
    }

    public dealDamageInstant(target: Unit, amount: number) {
        const result = target.takeDamage(amount, this);
        if (result > 0) {
            this.events.dealDamage.trigger({
                source: this,
                target: target,
                amount: amount
            });
        }
    }

    public getCost() {
        return this.cost;
    }

    public getImage() {
        return this.imageUrl;
    }

    public isPlayable(game: Game): boolean {
        if (this.owner === -1) {
            throw new Error('Card owner unassigned');
        }
        const owner = game.getPlayer(this.owner);
        return (
            game.isPlayerTurn(this.owner) &&
            game.canTakeAction() &&
            game.isPlayPhase() &&
            owner.getPool().meetsReq(this.cost) &&
            (!this.targeter.needsInput() ||
                this.targeter.isOptional() ||
                this.targeter.getValidTargets(this, game).length > 0)
        );
    }

    public getPrototype() {
        return {
            id: this.getId(),
            data: this.getDataId(),
            owner: this.owner
        };
    }

    public isAttacking() {
        return false;
    }

    public isBlocking() {
        return false;
    }

    public getDataId() {
        return this.dataId;
    }

    public getId() {
        return this.id;
    }

    public enterTheBattlefield(game: Game) {
        this.mechanics.forEach(mechanic => {
            if (mechanic instanceof TriggeredMechanic) {
                mechanic.getTrigger().register(this, game);
            }
            mechanic.enter(this, game);
        });
    }

    public play(game: Game) {
        this.enterTheBattlefield(game);
        this.events.play.trigger({});
        if (!this.isUnit()) {
            game.addToCrypt(this);
        }
    }

    public getText(game?: Game): string {
        if (this.text) {
            return this.text;
        }
        return this.mechanics
            .map(mechanic => mechanic.getText(this, game))
            .join(' ');
    }

    public getTargeter() {
        return this.targeter;
    }

    public getTargeters(): Targeter[] {
        return [this.targeter];
    }

    public setOwner(owner: number) {
        this.owner = owner;
    }

    public setId(id: string) {
        this.id = id;
    }

    public getOwner(): number {
        if (this.owner === -1) {
            // throw new Error('Card has no owner');
        }
        return this.owner;
    }

    public getName() {
        return this.name;
    }

    public isUnit(): boolean {
        return this.getCardType() === CardType.Unit;
    }

    public toString(): string {
        return `${this.name}: (${this.cost})`;
    }

    public evaluate(game: Game, context: EvalContext, evaluated: EvalMap): number {
        return Mechanic.sumValues(
            this.mechanics.map(mechanic =>
                mechanic.evaluate(this, game, context, evaluated)
            )
        );
    }

    public evaluateTarget(target: any, game: Game, evaluated: EvalMap): number {
        return this.mechanics
            .map(mechanic =>
                mechanic instanceof TargetedMechanic
                    ? mechanic.evaluateTarget(this, target, game, evaluated)
                    : 0
            )
            .reduce((a, b) => a + b, 0);
    }
}
