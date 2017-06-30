import { serialize, serializeAs, deserialize } from 'cerialize';

import { Resource } from './resource';
import { Game } from './game';
import { Player } from './player';
import { Mechanic } from './mechanic';
import { Targeter, Untargeted } from './targeter';
import { remove } from 'lodash';


export abstract class Card {
    public name: string;
    protected id: string;
    protected set: string;
    protected rarity: number;
    protected mechanics: Mechanic[] = [];

    protected cost: Resource;
    protected unit = false;
    protected owner: number;
    abstract dataId: string;

    protected targeter: Targeter<any> = new Untargeted();

    constructor() {
        this.id = Math.random().toString(16)
    }

    public isPlayable(game: Game): boolean {
        let owner = game.getPlayer(this.owner);
        // Todo, check resource and target
        return game.isPlayerTurn(this.owner);
    }

    public getPrototype() {
        return {
            id: this.getId(),
            data: this.getDataId()
        }
    }

    public getDataId() {
        return this.dataId;
    }

    public getId() {
        return this.id;
    }

    public play(game: Game) {
        game.getPlayer(this.owner).reduceResource(this.cost);
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
}
