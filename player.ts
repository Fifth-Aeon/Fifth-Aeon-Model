import { Card, GameZone } from './card';
import { Unit, UnitType } from './unit';
import { sample, remove } from 'lodash';
import { GameFormat } from './gameFormat';
import { Game, GameSyncEvent, SyncEventType } from './game';
import { Resource } from './resource';
import { EventType } from './gameEvent';

import { shuffle } from 'lodash';
import { ChoiceHeuristic } from './ai';

export class Player extends Unit {
    private format: GameFormat;
    private hand: Array<Card>;
    private deck: Array<Card>;
    private resource: Resource;
    protected life: number;
    private hasPlayedResource = false;
    public dataId = '';
    private drawDisabled = false;
    private drawRequests = 0;

    private hardHandLimit = 12;
    private softHandLimit = 8;

    constructor(private parent: Game, cards: Array<Card>, private playerNumber: number, initResource: Resource, life: number) {
        super('Player', 'Player', 'hearts.png', UnitType.Player, new Resource(0), null, 0, life, []);
        this.deck = cards;
        this.deck.forEach(card => card.setOwner(playerNumber));
        this.hand = [];
        this.life = life;
        this.resource = new Resource(0);
        this.resource.add(initResource);
    }

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
        card.setLocation(GameZone.Hand);
        this.hand.push(card);
        this.getEvents().trigger(EventType.CardDrawn, new Map([['card', card]]));
    }

    public addToDeck(card: Card) {
        this.deck.push(card);
    }

    public getPlayerNumber() {
        return this.playerNumber;
    }

    public canPlayResource(): boolean {
        return this.parent.canTakeAction() && !this.hasPlayedResource;
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
        let index = parseInt(query, 10);
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

    public die() {
        this.events.trigger(EventType.Death, new Map());
    }

    public removeCardFromHand(card: Card) {
        remove(this.hand, (toRem: Card) => toRem.getId() === card.getId());
    }

    public getDeck() {
        return this.deck;
    }

    public discardExtra(game: Game) {
        let num = this.hand.length - this.softHandLimit;
        if (num > 0)
            this.discard(game, num, () => game.nextTurn());
        else
            game.nextTurn();
    }

    public replace(game: Game, min: number, max: number) {
        game.promptCardChoice(this.getPlayerNumber(), this.hand, min, max, (cards: Card[]) => {
            cards.forEach(card => {
                this.removeCardFromHand(card);
                this.addToDeck(card);
                this.drawCard();
            });
        }, 'to replace', ChoiceHeuristic.ReplaceHeuristic);
    }

    public discard(game: Game, count: number = 1, cb?: (cards: Card[]) => void) {
        if (count >= this.hand.length) {
            this.hand = [];
            return;
        }
        game.promptCardChoice(this.getPlayerNumber(), this.hand, count, count, (cards: Card[]) => {
            cards.forEach(card => {
                this.removeCardFromHand(card);
                game.addToCrypt(card);
            });
            if (cb) cb(cards);
        }, 'to discard', ChoiceHeuristic.DiscardHeuristic);
    }

    public searchForCard(game: Game, count: number) {
        game.queryCards(
            (queried: Game) => shuffle(queried.getPlayer(this.playerNumber).getDeck()),
            (deck: Card[]) => {
                game.promptCardChoice(this.playerNumber, deck, 0, count, (cards: Card[]) => {
                    cards.forEach(card => {
                        this.drawGeneratedCard(card);
                        deck.splice(deck.indexOf(card), 1);
                    });
                }, 'to draw', ChoiceHeuristic.DrawHeuristic);
            });
    }

    public drawCard() {
        if (this.drawDisabled) {
            return;
        }
        let drawn = sample(this.deck);
        remove(this.deck, drawn);
        if (!drawn)
            return;
        if (this.hand.length > this.hardHandLimit) {
            this.parent.addToCrypt(drawn);
        } else {
            this.addToHand(drawn);
        }
        this.parent.addGameEvent(new GameSyncEvent(SyncEventType.Draw, {
            playerNo: this.playerNumber,
            card: drawn.getPrototype(),
            discarded: this.hand.length > this.hardHandLimit
        }));
    }

    public drawGeneratedCard(card: Card) {
        if (this.hand.length > this.hardHandLimit) {
            this.parent.addToCrypt(card);
        } else {
            this.addToHand(card);
        }
    }

    public evaluate() {
        return 1000000;
    }
}
