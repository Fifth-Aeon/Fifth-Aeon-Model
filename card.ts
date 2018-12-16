import { Resource } from './resource';
import { Game } from './game';
import { Player } from './player';
import { Mechanic, EvalContext, TriggeredMechanic } from './mechanic';
import { Targeter } from './targeter';
import { Unit } from './unit';



import { remove, sumBy, groupBy } from 'lodash';
import { CardEventSystem } from './events/eventSystems';

export enum GameZone {
    Deck, Hand, Board, Crypt
}

export enum CardType {
    Spell, Unit, Item, Enchantment
}

export interface CardPrototype {
    id: string;
    data: string;
    owner: number;
}

export class Card {
    public name: string;
    protected id: string;
    protected set: string;
    protected rarity: number;
    protected mechanics: Mechanic[] = [];

    protected cost: Resource;
    protected unit = false;
    protected owner: number;
    protected dataId: string;
    protected imageUrl: string;
    protected location: GameZone;
    protected text: string = null;
    protected events = new CardEventSystem();

    protected targeter: Targeter;

    constructor(dataId: string, name: string, imageUrl: string, cost: Resource,
        targeter: Targeter, mechanics: Array<Mechanic>, text?: string) {
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

    public getEvents() {
        return this.events;
    }

    private generateId(): string {
        return Math.random().toString(16).substring(2);
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
        let result = target.takeDamage(amount, this);
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
        let owner = game.getPlayer(this.owner);
        return game.isPlayerTurn(this.owner) &&
            game.canTakeAction() &&
            game.isPlayPhase() &&
            owner.getPool().meetsReq(this.cost) &&
            (!this.targeter.needsInput() || this.targeter.isOptional() ||
                this.targeter.getValidTargets(this, game).length > 0);
    }

    public getPrototype(): CardPrototype {
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
            if (mechanic instanceof TriggeredMechanic)
                mechanic.getTrigger().register(this, game);
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

    public getText(game: Game): string {
        if (this.text)
            return this.text;
        return this.mechanics.map(mechanic => mechanic.getText(this, game)).join(' ');
    }

    public getTargeter() {
        return this.targeter;
    }

    public getTargeters(): Targeter[] {
        return [this.targeter];
    }

    public setOwner(owner: number) {
        if (owner === undefined)
            throw Error();
        this.owner = owner;
    }

    public setId(id: string) {
        this.id = id;
    }

    public getOwner() {
        return this.owner;
    }

    public getName() {
        return this.name;
    }

    public isUnit(): boolean {
        return this.unit;
    }

    public toString(): string {
        return `${this.name}: (${this.cost})`;
    }

    public evaluate(game: Game, context: EvalContext) {
        return Mechanic.sumValues(this.mechanics.map(mechanic => mechanic.evaluate(this, game, context)));
    }

    public evaluateTarget(target: Unit, game: Game) {
        return this.mechanics.map(mechanic => mechanic.evaluateTarget(this, target, game)).reduce((a, b) => a + b);
    }
}
