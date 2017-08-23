import { Card, Location } from './card';
import { Unit, UnitType } from './unit';
import { sample, remove } from 'lodash';
import { GameFormat } from './gameFormat';
import { Game, SyncGameEvent, GameEventType } from './game';
import { Resource } from './resource';
import { EventType } from './gameEvent';

import { shuffle } from 'lodash';

export class Player extends Unit {
    private format: GameFormat;
    private hand: Array<Card>;
    private deck: Array<Card>;
    private resource: Resource;
    protected life: number;
    private hasPlayedResource: boolean = false;
    public dataId = '';

    private hardHandLimit = 12;
    private softHandLimit = 10;

    constructor(private parent: Game, cards: Array<Card>, private playerNumber: number, initResource: Resource, life: number) {
        super('Player', 'Player', '', UnitType.Player, new Resource(Infinity), null, 0, life, []);
        this.deck = cards;
        this.deck.forEach(card => card.setOwner(playerNumber));
        this.hand = [];
        this.life = life;
        this.resource = new Resource(0);
        this.resource.add(initResource);
    }

    private drawDisabled: boolean = false;
    public disableDraw() {
        this.drawDisabled = true;
    }

    public reduceResource(resource: Resource) {
        this.resource.subtract(resource);
    }

    public getHand() {
        return this.hand;
    }

    public addToHand(card: Card) {
        card.setOwner(this.playerNumber);
        card.setLocation(Location.Hand);
        this.hand.push(card);
    }

    public addToDeck(card: Card) {
        this.deck.push(card);
    }

    public getPlayerNumber() {
        return this.playerNumber;
    }

    public canPlayResource(): boolean {
        return !this.hasPlayedResource;
    }

    public playResource(played: Resource) {
        this.resource.add(played);
        this.hasPlayedResource = true;
    }

    public addLife(diff: number) {
        this.life += diff;
    }

    public startTurn() {
        this.drawCard();
        this.hasPlayedResource = false;
        this.resource.renew();
    }

    public getPool() {
        return this.resource;
    }

    public drawCards(quantity: number) {
        for (let i = 0; i < quantity; i++) {
            this.drawCard();
        }
    }

    public queryHand(query: string) {
        return this.queryCards(query, this.hand);
    }

    public queryCards(query: string, cards: Card[]): Card | null {
        let index = parseInt(query);
        if (!isNaN(index)) {
            if (cards[index])
                return cards[index];
        }
        return cards.find(card => {
            return card.getName().includes(query);
        }) || null;
    }

    public playCard(game: Game, card: Card, free: boolean = false) {
        remove(this.hand, (toRem: Card) => toRem === card);
        if (!free)
            this.reduceResource(card.getCost());
        card.play(game);
    }

    protected die() {
        this.events.trigger(EventType.Death, new Map());
    }

    public removeCardFromHand(card: Card) {
        remove(this.hand, (toRem: Card) => toRem === card);
    }

    public getDeck() {
        return this.deck;
    }

    public discardExtra(game: Game) {
        let num = this.hand.length - this.softHandLimit;
        if (num > 0)
            this.discard(game, num, () => game.pass());
        else
            game.pass();
    }

    public replace(game: Game, count: number) {
        game.promptCardChoice(this.getPlayerNumber(), this.hand, count, (cards: Card[]) => {
            cards.forEach(card => {
                this.removeCardFromHand(card);
                this.addToDeck(card);
                this.drawCard();
            });
        });
    }

    public discard(game: Game, count: number = 1, cb: (cards: Card[]) => void) {
        if (count >= this.hand.length) {
            this.hand = [];
            return;
        }
        game.promptCardChoice(this.getPlayerNumber(), this.hand, count, (cards: Card[]) => {
            cards.forEach(card => {
                this.removeCardFromHand(card);
                game.addToCrypt(card);
            });
            cb(cards);
        });
    }

    public searchForCard(game: Game, count: number) {
        game.queryCards(
            (game: Game) => shuffle(game.getPlayer(this.playerNumber).getDeck()),
            (deck) => {
                game.promptCardChoice(this.playerNumber, deck, 1, (cards: Card[]) => {
                    cards.forEach(card => {
                        this.drawGeneratedCard(card);
                        deck.splice(deck.indexOf(card), 1);
                    });
                });
            });
    }

    public drawCard() {
        if (this.drawDisabled)
            return;
        let drawn = sample(this.deck);
        remove(this.deck, drawn);
        if (!drawn)
            return;

        if (this.hand.length >= this.hardHandLimit) {
            this.parent.addToCrypt(drawn);
        } else {
            this.addToHand(drawn);
        }
        this.parent.addGameEvent(new SyncGameEvent(GameEventType.draw, {
            playerNo: this.playerNumber,
            card: drawn.getPrototype(),
            discarded: this.hand.length > this.hardHandLimit
        }));
    }

    public drawGeneratedCard(card: Card) {
        this.addToHand(card);
    }
}
