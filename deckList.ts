import { GameFormat } from './gameFormat';
import { allCards, CardFactory } from './cards/allCards';
import { Card } from './card';

import { ResourceTypeNames } from './resource';
import { sample, sampleSize, remove, sum } from 'lodash';

export class DeckList {

    private records = new Map<string, number>();
    private cardCount: number = 0;

    constructor(private format: GameFormat) {
        if (Math.random() > 0.5) {
            this.generateTwoColorDeck();
        } else {
            this.generateOneColorDeck();
        }
    }

    public toJson() {
        return JSON.stringify([...Array.from(this.records.entries())]);
    }

    public fromJson(jsonStr:string) {
        this.records = new Map(JSON.parse(jsonStr)) as Map<string, number>;
        this.cardCount = sum(Array.from(this.records.values()))
    }

    public randomDeckWithColors(colors: Set<string>) {
        let validCards = Array.from(allCards.values()).filter(factory => {
            return factory().getCost().isInColors(colors);
        });
        for (let i = 0; i < this.format.minDeckSize; i++) {
            let constr = sample(validCards);
            if (!constr)
                throw new Error("No cards to construct");
            let card = constr();
            this.addCard(card);
            if (this.records.get(card.getDataId()) == this.format.cardsOfRarity[0])
                remove(validCards, fact => fact == constr);
        }
    }

    public generateTwoColorDeck() {
        this.randomDeckWithColors(new Set(sampleSize(ResourceTypeNames, 2) as Array<string>));
    }

    public generateOneColorDeck() {
        this.randomDeckWithColors(new Set(sampleSize(ResourceTypeNames, 1) as Array<string>));
    }

    public size() {
        return this.cardCount;
    }

    public addCard(card: Card) {
        let currValue = this.records.get(card.getDataId()) || 0;
        let limit = this.format.cardsOfRarity[0]
        if (currValue < limit) {
            this.records.set(card.getDataId(), currValue + 1)
            this.cardCount++;
        }
    }

    public isValid() {
        return this.cardCount >= this.format.minDeckSize && this.cardCount <= this.format.maxDeckSize;
    }

    public removeCard(card: Card) {
        if (!this.records.has(card.getDataId()))
            return;
        let currValue = this.records.get(card.getDataId());
        if (currValue == 1)
            this.records.delete(card.getDataId());
        else
            this.records.set(card.getDataId(), currValue - 1)
        this.cardCount--;
    }

    public toDeck(): CardFactory[] {
        let deck = [];
        for (let entry of Array.from(this.records.entries())) {
            for (let i = 0; i < entry[1]; i++) {
                deck.push(allCards.get(entry[0]));
            }
        }
        return deck;
    }

    public getRecordList() {
        return Array.from(this.records.entries()).map(entry => {
            return {
                card: allCards.get(entry[0])(),
                number: entry[1]
            }
        }).sort((rec1, rec2) => rec1.card.getCost().getNumeric() - rec2.card.getCost().getNumeric());
    }
}