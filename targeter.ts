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
    
    abstract getText(): string;
    
    public getValidTargets(card: Card, game: Game) {
        return new Array<Unit>();
    }
    
    public isTargetable(card:Card, game:Game): boolean {
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