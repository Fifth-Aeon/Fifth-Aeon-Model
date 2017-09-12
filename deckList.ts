import { GameFormat } from './gameFormat';
import { allCards, CardFactory } from './cards/allCards';
import { Card } from './card';

import { ResourceTypeNames } from './resource';
import { sample, sampleSize, remove, sum } from 'lodash';

export class DeckList {
    public name: string = 'New Deck';
    public avatar: string = '';
    private records = new Map<string, number>();
    private cardCount: number = 0;

    constructor(private format: GameFormat) {
        this.generateRandomNColorDeck(1);
    }

    public randomDeckWithColors(colors: Set<string>) {
        this.clear();
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
        this.genMetadata();
    }

    public genMetadata() {
        let list = this.getRecordList();
        this.avatar = list[list.length - 1].card.getImage();
        this.name = Array.from(this.getColors().values()).join('-') + ' Deck';
    }

    public getColors() {
        let colors = new Set<string>();
        for (let record of this.getRecordList()) {
            record.card.getCost().getColors().forEach(color => colors.add(color));
        }
        return colors;
    }

    public clear() {
        this.records = new Map<string, number>();
        this.cardCount = 0;
    }

    public generateRandomNColorDeck(n: number) {
        n = Math.max(Math.min(n, 4), 1);
        this.randomDeckWithColors(new Set(sampleSize(ResourceTypeNames, n) as Array<string>));
    }

    public toJson() {
        return JSON.stringify({
            records: [...Array.from(this.records.entries())],
            name: this.name,
            avatar: this.avatar
        })
    }


    public fromJson(jsonStr: string) {
        let data = JSON.parse(jsonStr)
        this.records = new Map(data.records) as Map<string, number>;
        this.name = data.name;
        this.avatar = data.avatar;
        this.cardCount = sum(Array.from(this.records.values()))
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