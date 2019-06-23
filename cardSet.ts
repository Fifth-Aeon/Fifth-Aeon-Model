import { CardData } from './cards/cardList';

export interface SetInformation {
    id: string;
    name: string;
    description: string;
}

export interface CardSet extends SetInformation {
    cards: CardData[];
}