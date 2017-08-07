import { GameFormat } from './gameFormat';
import { allCards, CardFactory } from './cards/allCards';
import { Card } from './card';

export class DeckList {

    private records = new Map<string, number>();

    constructor(private format: GameFormat) { }

    public addCard(card: Card) {
        let currValue = this.records.get(card.getId()) || 0;
        let limit = this.format.cardsOfRarity[0]
        if (currValue < limit) {
            this.records.set(card.getId(), currValue + 1)
        }
    }

    public removeCard(card: Card) {
        if (!this.records.has(card.getId()))
            return;
        let currValue = this.records.get(card.getId());
        if (currValue == 1)
            this.records.delete(card.getId());
        else
            this.records.set(card.getId(), currValue - 1)
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
        return Array.from(this.records.entries());
    }
}