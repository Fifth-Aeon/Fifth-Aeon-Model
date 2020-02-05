import { EvalContext, EvalMap } from '../mechanic';
import { CardEventSystem } from '../events/eventSystems';
import { Resource } from '../resource';
import { Game } from '../game';
import { Targeter } from '../targeter';

export enum GameZone {
    Deck,
    Hand,
    Board,
    Crypt
}

export enum CardType {
    Spell,
    Unit,
    Item,
    Enchantment
}


export interface CardPrototype {
    id: string;
    data: string;
    owner: number;
}

export interface Damagable {
    takeDamage(amount: number, source: Card): number;
}

export interface Card {
    getEvents(): CardEventSystem;

    getCardType(): CardType;

    setText(text: string): void;

    setLocation(location: GameZone): void;

    getLocation(): GameZone;

    draw(): void;

    dealDamageInstant(target: Damagable, amount: number): void;

    getCost(): Resource;

    getImage(): string;

    isPlayable(game: Game): boolean;

    getPrototype(): CardPrototype;

    isAttacking(): boolean;

    isBlocking(): boolean;

    getDataId(): string;

    getId(): string;

    enterTheBattlefield(game: Game): void;

    play(game: Game): void;

    getText(game?: Game): string;

    getTargeter(): Targeter;

    getTargeters(): Targeter[];

    setOwner(owner: number): void;

    setId(id: string): void;

    getOwner(): number;

    getName(): string;

    isUnit(): boolean;

    toString(): string;

    evaluate(game: Game, context: EvalContext, evaluated: EvalMap): number;

    evaluateTarget(target: any, game: Game, evaluated: EvalMap): number;
}
