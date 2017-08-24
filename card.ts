import { serialize, serializeAs, deserialize } from 'cerialize';

import { Resource } from './resource';
import { Game } from './game';
import { Player } from './player';
import { Mechanic } from './mechanic';
import { Targeter, Untargeted } from './targeter';
import { remove } from 'lodash';
import { Unit } from './unit';


export enum Location {
    Deck, Hand, Board, Crypt
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
    protected location: Location;

    protected targeter: Targeter = new Untargeted();

    constructor(dataId: string, name: string, imageUrl: string, cost: Resource, targeter: Targeter, mechanics: Array<Mechanic>) {
        this.dataId = dataId;
        this.name = name;
        this.imageUrl = imageUrl;
        this.cost = cost;
        this.targeter = targeter;
        this.mechanics = mechanics;
        this.mechanics.forEach(mechanic => mechanic.attach(this));
        this.location = Location.Deck;
        this.id = Math.random().toString(16)
    }


    public setLocation(location: Location) {
        this.location = location;
    }
    public getLocation() {
        return this.location;
    }

    public draw() {
        this.location = Location.Hand;
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
            (!this.targeter.needsInput() || this.targeter.optional() ||
                this.targeter.getValidTargets(this, game).length > 0);
    }

    public getPrototype() {
        return {
            id: this.getId(),
            data: this.getDataId(),
            owner: this.owner
        }
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

    public play(game: Game) {
        this.mechanics.forEach(mechanic => mechanic.run(this, game));
        if (!this.isUnit()) {
            game.addToCrypt(this);
        }
    }

    public getText(): string {
        return this.mechanics.map(mechanic => mechanic.getText(this)).join(' ');
    }

    public getTargeter() {
        return this.targeter;
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
        return `${this.name}: (${this.cost})`
    }

    public evaluate() {
        return 0;
    }

    public evaluateTarget(target: Unit) {
        return this.mechanics.map(mechanic => mechanic.evaluateTarget(this.getOwner(), target)).reduce((a, b) => a + b);
    }
}
