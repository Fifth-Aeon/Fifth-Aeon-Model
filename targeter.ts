import { Game } from './game';
import { Card } from './Card';
import { Unit } from './unit';

import { every } from 'lodash';

export abstract class Targeter {
    protected targets: Array<Unit> = [];

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
        return !this.needsInput() || this.optional() ||
            this.getValidTargets(card, game).length > 0;
    }

    public optional(): boolean {
        return false;
    }

    public targetsAreValid(card: Card, game: Game) {
        if (!this.needsInput() || this.optional())
            return true;
        let valid = new Set(this.getValidTargets(card, game));
        return this.targets.length > 0 && every(this.targets, target => valid.has(target));
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

export class SingleUnit extends Targeter {

    constructor(private isOptional: boolean = false) {
        super()
    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits();
    }
    public getText() {
        return 'target unit';
    }
    public optional() {
        return this.isOptional
    }
}

export class FriendlyUnit extends SingleUnit {
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getOwner() == card.getOwner());
    }
    public getText() {
        return 'target friendly unit';
    }

}

export class AllUnits extends Targeter {
    protected lastTargets: Array<Unit>;
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
        this.lastTargets = game.getBoard().getAllUnits().filter(unit => unit != card);
        return this.lastTargets;
    }
}


export class FriendlyUnits extends AllUnits {
    public getText() {
        return 'friendly units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() == card.getOwner());
        return this.lastTargets;
    }
}

export class EnemyUnits extends AllUnits {
    public getText() {
        return 'all enemy units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() != card.getOwner());
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
            .filter(unit => unit.getOwner() == card.getOwner())
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
            .filter(unit => unit.getOwner() != card.getOwner())
            .concat(game.getPlayer(game.getOtherPlayerNumber(card.getOwner())));
        return this.lastTargets;
    }
}