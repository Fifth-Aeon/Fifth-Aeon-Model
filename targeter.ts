import { Game } from './game';
import { Unit } from './unit';

export abstract class Targeter {
    protected target: Array<Unit>;
    public needsInput(): boolean {
        return true;
    }
    public setTarget(target: Array<Unit>) {
        this.target = target;
    }
    public getTargets(game: Game): Array<Unit> {
        return this.target;
    }
    abstract getText(): string;
    abstract getValidTargets(game: Game): Array<Unit>;
}

export class Untargeted extends Targeter {
    public getValidTargets(game: Game) {
        return [];
    }
    public getText() {
        return '';
    }
    public needsInput() {
        return false;
    }
}

export class SingleUnit extends Targeter {
    public getValidTargets(game: Game) {
        return game.getBoard().getAllUnits();
    }
    public getText() {
        return 'target unit';
    }
}

export class AllUnits extends Targeter {
    public getValidTargets(game: Game) {
        return [];
    }
    public getText() {
        return 'all units';
    }
    public needsInput() {
        return false;
    }
    public getTargets(game: Game): Array<Unit> {
        return game.getBoard().getAllUnits();
    }
}