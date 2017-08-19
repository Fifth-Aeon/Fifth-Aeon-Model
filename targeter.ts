import { Game } from './game';
import { Card } from './Card';
import { Unit } from './unit';

import { every } from 'lodash';

export abstract class Targeter {
    protected target: Array<Unit> = [];
    public needsInput(): boolean {
        return true;
    }
    public setTarget(target: Array<Unit>) {
        this.target = target;
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        return this.target;
    }
    abstract getText(): string;
    public getValidTargets(card: Card, game: Game) {
        return new Array<Unit>();
    }
    public optional(): boolean {
        return false;
    }
    public targetsAreValid(card: Card, game: Game) {
        if (!this.needsInput() || this.optional())
            return true;
        let valid = new Set(this.getValidTargets(card, game));
        return this.target.length > 0 && every(this.target, target => valid.has(target));
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
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits();
    }
    public getText() {
        return 'target unit';
    }
}

export class AllUnits extends Targeter {
    public getText() {
        return 'all units';
    }
    public needsInput() {
        return false;
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        return game.getBoard().getAllUnits();
    }
}

export class AllOtherUnits extends Targeter {
    public getText() {
        return 'all other units';
    }
    public needsInput() {
        return false;
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        return game.getBoard().getAllUnits().filter(unit => unit != card);
    }
}