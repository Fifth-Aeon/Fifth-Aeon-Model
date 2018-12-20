import { random, sample } from 'lodash';
import { Card } from './card';
import { cardList } from './cards/cardList';
import { DeckList } from './deckList';

export interface SavedCollection {
    gold: number;
    packs: number;
    records: [string, number][];
}

export interface Rewards {
    gold: number;
    packs: number;
    cards?: number;
}

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
        const reward: Rewards = {
            packs: won ? 1 : 0,
            gold: random(0, 100)
        };
        this.addReward(reward);
        return reward;
    }

    public addReward(reward: Rewards) {
        this.packs += reward.packs;
        this.gold += reward.gold;
        if (reward.cards) {
            const cardsAwarded = [];
            for (let i = 0; i < reward.cards; i++) {
                const awarded = this.getRandomCardId();
                cardsAwarded.push(awarded);
                this.addCard(awarded, 1);
            }
            return cardsAwarded;
        }
        return [];
    }

    public removePack() {
        this.packs--;
    }

    private addBooster(pack: Booster) {
        const cards = pack.open();
        for (const cardId of cards) {
            this.addCard(cardId);
        }
        return cards;
    }

    public getPackCount() {
        return this.packs;
    }

    public getGold() {
        return this.gold;
    }

    public canOpenBooster() {
        return this.packs > 0;
    }

    public openBooster() {
        if (!this.canOpenBooster()) {
            return;
        }
        const pack = new Booster();
        this.packs--;
        return this.addBooster(pack);
    }

    public canBuyPack() {
        return this.gold > 100;
    }

    public buyPack() {
        if (!this.canBuyPack()) {
            return;
        }
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
        const clone = new DeckList();
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
        const data = JSON.parse(jsonStr) as SavedCollection;
        this.fromSavable(data);
    }

    public addDeck(deck: DeckList) {
        for (const record of deck.getRecordList()) {
            this.addCard(record.card, record.number);
        }
    }

    public addCard(card: Card | string, number = 1) {
        const id = typeof card === 'string' ? card : card.getDataId();
        const currValue = this.records.get(id) || 0;
        this.records.set(id, currValue + number);
    }

    public addCardPlayset(card: Card | string) {
        const id = typeof card === 'string' ? card : card.getDataId();
        const currValue = this.records.get(id) || 0;
        this.records.set(id, Math.max(currValue, 4));
    }

    public removeCard(card: Card) {
        if (!this.records.has(card.getDataId())) {
            return;
        }
        const currValue = this.records.get(card.getDataId());
        if (currValue === 1) {
            this.records.delete(card.getDataId());
        } else {
            this.records.set(card.getDataId(), currValue - 1);
        }
    }

    public removeGold(amount: number) {
        this.gold = Math.max(0, this.gold - amount);
    }

    public getCardCount(card: Card) {
        return this.records.get(card.getDataId()) || 0;
    }

    public getCards() {
        const cards: Card[] = [];
        for (const id of Array.from(this.records.keys())) {
            const card = cardList.getCard(id);
            if (card.getDataId() !== 'default') {
                cards.push(card);
            }
        }
        return cards;
    }

    public getRecordList() {
        return Array.from(this.records.entries())
            .map(entry => {
                return {
                    card: cardList.getCard(entry[0]),
                    number: entry[1]
                };
            })
            .sort(
                (rec1, rec2) =>
                    rec1.card.getCost().getNumeric() -
                    rec2.card.getCost().getNumeric()
            );
    }

    private getRandomCardId() {
        const cardIds = cardList.getIds();

        return sample(cardIds);
    }
}

export class Booster {
    constructor(private cardCount: number = 6) {}

    public open() {
        const openedCards = Array<string>(this.cardCount);
        const cardIds = cardList.getIds();

        for (let i = 0; i < this.cardCount; i++) {
            const drawn = sample(cardIds);
            openedCards[i] = drawn;
        }
        return openedCards;
    }
}
