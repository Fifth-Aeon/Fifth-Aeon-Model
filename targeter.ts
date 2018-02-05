import { Game } from './game';
import { Card } from './Card';
import { Unit } from './unit';

import { every } from 'lodash';

export abstract class Targeter {
    protected targets: Array<Unit> = [];
    protected optional = false;

    public needsInput(): boolean {
        return true;
    }

    public setTargets(target: Array<Unit>) {
        this.targets = target;
    }

    public getTargets(card: Card, game: Game): Array<Unit> {
        return this.targets;
    }

    public getLastTargets() {
        return this.targets;
    }

    abstract getText(): string;

    public getValidTargets(card: Card, game: Game) {
        return new Array<Unit>();
    }

    public isTargetable(card: Card, game: Game): boolean {
        return !this.needsInput() || this.isOptional() ||
            this.getValidTargets(card, game).length > 0;
    }

    public isOptional(): boolean {
        return this.optional;
    }

    public setOptional(val: boolean) {
        this.optional = val;
        return this;
    }

    public targetsAreValid(card: Card, game: Game) {
        if (!this.needsInput() || this.isOptional())
            return true;
        let valid = new Set(this.getValidTargets(card, game));
        return this.targets.length > 0 && every(this.targets, target => valid.has(target));
    }
}
export class OwningPlayer extends Targeter {
    public needsInput() {
        return false;
    }

    public getTargets(card: Card, game: Game) {
        return [game.getPlayer(card.getOwner())];
    }

    public getText() {
        return 'this card’s owner';
    }
}

export class EnemyPlayer extends Targeter {
    public needsInput() {
        return false;
    }

    public getTargets(card: Card, game: Game) {
        return [game.getPlayer(game.getOtherPlayerNumber(card.getOwner()))];
    }

    public getText() {
        return 'this unit’s owner’s opponent';
    }
}

export class Untargeted extends Targeter {
    public getText() {
        return '';
    }
    public needsInput() {
        return false;
    }
}

export class SelfTarget extends Targeter {
    public getTargets(card: Card, game: Game): Array<Unit> {
        return [card as Unit];
    }

    public getText() {
        return 'this unit';
    }
    public needsInput() {
        return false;
    }

}

export class SingleUnit extends Targeter {

    constructor(optional: boolean = false) {
        super();
        this.optional = optional;

    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits();
    }
    public getText() {
        return 'target unit';
    }
    public isOptional() {
        return this.optional
    }
}

export class FriendlyUnit extends SingleUnit {
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getOwner() === card.getOwner());
    }
    public getText() {
        return 'target friendly unit';
    }

}

export class EnemyUnit extends SingleUnit {
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getOwner() !== card.getOwner());
    }
    public getText() {
        return 'target enemy unit';
    }
}


export class AllUnits extends Targeter {
    protected lastTargets: Array<Unit> = [];
    public getText() {
        return 'all units';
    }
    public needsInput() {
        return false;
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits();
        return this.lastTargets;
    }
    public getLastTargets() {
        return this.lastTargets
    }
}

export class AllOtherUnits extends AllUnits {
    public getText() {
        return 'all other units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits().filter(unit => unit !== card);
        return this.lastTargets;
    }
}


export class FriendlyUnits extends AllUnits {
    public getText() {
        return 'friendly units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() === card.getOwner());
        return this.lastTargets;
    }
}

export class EnemyUnits extends AllUnits {
    public getText() {
        return 'all enemy units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() !== card.getOwner());
        return this.lastTargets;
    }
}

export class AllPlayers extends AllUnits {
    public getText() {
        return 'all players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = [
            game.getPlayer(card.getOwner()),
            game.getPlayer(game.getOtherPlayerNumber(card.getOwner()))
        ];
        return this.lastTargets;
    }
}

export class Everyone extends AllUnits {
    public getText() {
        return 'all units and players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .concat(game.getPlayer(card.getOwner()))
            .concat(game.getPlayer(game.getOtherPlayerNumber(card.getOwner())));
        return this.lastTargets;
    }
}

export class Friends extends AllUnits {
    public getText() {
        return 'all friendly units and players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() === card.getOwner())
            .concat(game.getPlayer(card.getOwner()));
        return this.lastTargets;
    }
}

export class Enemies extends AllUnits {
    public getText() {
        return 'all enemy units and players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() !== card.getOwner())
            .concat(game.getPlayer(game.getOtherPlayerNumber(card.getOwner())));
        return this.lastTargets;
    }
}
