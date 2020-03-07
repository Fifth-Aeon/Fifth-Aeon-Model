import { every } from 'lodash';
import { Card  } from './card-types/card';
import { Game } from './game';
import { Mechanic } from './mechanic';
import { Permanent } from './card-types/permanent';
import { Unit, isUnit} from './card-types/unit';
import { Enchantment, isEnchantment } from './card-types/enchantment';

export abstract class Targeter {
    protected static id: string;
    protected targets: Array<Permanent> = [];
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

    public setTargets(target: Array<Permanent>) {
        this.targets = target;
    }

    public getTargets(card: Card, game: Game, mechanic?: Mechanic): Array<Permanent> {
        return this.targets;
    }

    public getUnitTargets(card: Card, game: Game, mechanic?: Mechanic): Array<Unit> {
        return this.getTargets(card, game, mechanic)
            .filter(isUnit);
    }

    public getEnchantmentTargets(card: Card, game: Game, mechanic?: Mechanic): Array<Enchantment> {
        return this.getTargets(card, game, mechanic)
            .filter(isEnchantment);
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
        return new Array<Permanent>();
    }

    public shouldUsePronoun(usePronoun: boolean) {
        this.usePronoun = usePronoun;
    }

    public isTargetable(card: Card, game: Game): boolean {
        return (
            !this.needsInput() ||
            this.isOptional() ||
            this.getValidTargets(card, game).length > 0
        );
    }

    public isOptional(): boolean {
        return this.optional;
    }

    public setOptional(val: boolean) {
        this.optional = val;
        return this;
    }

    public targetsAreValid(card: Card, game: Game) {
        if (!this.needsInput() || this.isOptional()) {
            return true;
        }
        const valid = new Set(this.getValidTargets(card, game));
        return (
            this.targets.length > 0 &&
            every(this.targets, target => valid.has(target))
        );
    }
}
