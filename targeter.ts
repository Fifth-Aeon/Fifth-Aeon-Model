import { Game } from './game';
import { Card } from './Card';
import { Unit } from './unit';

import { every } from 'lodash';

export abstract class Targeter {
    protected static id: string;
    protected targets: Array<Unit> = [];
    protected optional = false;
    protected usePronoun = false;

    public static getId() {
        return this.id;
    }

    public getId(): string {
        return (this.constructor as any).id;
    }

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

    public getTextOrPronoun(): string {
        return this.usePronoun ? this.getPronoun() : this.getText();
    }

    public getPronoun(): string {
        return 'it';
    }

    public getValidTargets(card: Card, game: Game) {
        return new Array<Unit>();
    }

    public shouldUsePronoun(usePronoun: boolean) {
        this.usePronoun = usePronoun;
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
