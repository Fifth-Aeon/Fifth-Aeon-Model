import { GameFormat, standardFormat } from './gameFormat';
import { allCards, CardFactory } from './cards/allCards';
import { Card } from './card';
import { DeckList } from './deckList';

import { ResourceTypeNames } from './resource';
import { sample, sampleSize, remove, sum, random } from 'lodash';

export interface SavedCollection {
    gold: number,
    packs: number,
    records: [string, number][];
}

export interface Rewards {
    gold: number,
    packs: number
}

const cardIds = Array.from(allCards.keys());

export class Collection {
    private records = new Map<string, number>();
    private gold: number;
    private packs: number;

    constructor(saved: SavedCollection = null) {
        this.gold = 0;
        this.packs = 3;
        if (saved) {
            this.fromSavable(saved);
        }
    }

    public addWinReward(won: boolean) {
        let reward: Rewards = {
            packs: won ? 1 : 0,
            gold: random(0, 100)
        }
        this.packs += reward.packs;
        this.gold += reward.gold;
        return reward;
    }

    private addBooster(pack: Booster) {
        let cards = pack.open();
        for (let cardId of cards) {
            this.addCard(cardId);
        }
        return cards;
    }

    public getPackCount() {
        return this.packs;
    }

    public canOpenBooster() {
        return this.packs > 0;
    }

    public openBooster() {
        if (!this.canOpenBooster()) return;
        let pack = new Booster();
        this.packs--;
        return this.addBooster(pack);
    }

    public canBuyPack() {
        return this.gold > 100;
    }

    public buyPack() {
        if (!this.canBuyPack()) return;
        this.gold -= 100;
        this.packs += 1;
    }

    public clear() {
        this.records = new Map<string, number>();
    }

    public toJson(spacing: number = null) {
        return JSON.stringify(this.getSavable(), null, spacing);
    }

    public clone() {
        let clone = new DeckList();
        clone.fromJson(this.toJson());
        return clone;
    }

    public getSavable(): SavedCollection {
        return {
            gold: this.gold,
            packs: this.packs,
            records: [...Array.from(this.records.entries())]
        };
    }

    public fromSavable(saveData: SavedCollection) {
        this.records = new Map(saveData.records) as Map<string, number>;
        this.gold = saveData.gold;
        this.packs = saveData.packs;
    }

    public fromJson(jsonStr: string) {
        let data = JSON.parse(jsonStr) as SavedCollection;
        this.fromSavable(data);
    }

    public addDeck(deck: DeckList) {
        for (let record of deck.getRecordList()) {
            this.addCard(record.card, record.number)
        }
    }

    public addCard(card: Card | string, number = 1) {
        let id = typeof card === 'string' ? card : card.getDataId();
        let currValue = this.records.get(id) || 0;
        this.records.set(id, currValue + number);
    }

    public removeCard(card: Card) {
        if (!this.records.has(card.getDataId()))
            return;
        let currValue = this.records.get(card.getDataId());
        if (currValue === 1)
            this.records.delete(card.getDataId());
        else
            this.records.set(card.getDataId(), currValue - 1);
    }

    public getCardCount(card: Card) {
        return this.records.get(card.getDataId()) || 0;
    }

    public getCards() {
        return Array.from(this.records.keys(), id => allCards.get(id)());
    }

    public getRecordList() {
        return Array.from(this.records.entries()).map(entry => {
            return {
                card: allCards.get(entry[0])(),
                number: entry[1]
            };
        }).sort((rec1, rec2) => rec1.card.getCost().getNumeric() - rec2.card.getCost().getNumeric());
    }
}

export class Booster {
    constructor(private cardCount: number = 6) { };

    public open() {
        let openedCards = Array<string>(this.cardCount);
        for (let i = 0; i < this.cardCount; i++) {
            let drawn = sample(cardIds);
            openedCards[i] = drawn;
        }
        return openedCards;
    }
}
