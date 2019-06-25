import { CardData } from './cards/cardList';

export interface SetInformation {
    id: string;
    name: string;
    description: string;
    public: boolean;
}

export interface CardSet extends SetInformation {
    cards: CardData[];
}