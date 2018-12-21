import { ResourcePrototype, Resource, ResourceType } from '../resource';
import { CardList } from './cardList';
import { CardType, Card } from '../card';

export enum ParameterType {
    Integer,
    NaturalNumber,
    Resource,
    ResourceType,
    Card,
    Spell,
    Unit,
    Item,
    Enchantment,
    CardType
}

export type ParameterData = number | string | ResourcePrototype;

const parseInteger = (data: ParameterData, min: number, max: number) => {
    if (typeof data === 'string') {
        data = parseInt(data, 10);
    }
    if (typeof data !== 'number' || isNaN(data)) {
        return 1;
    }
    return Math.min(max, Math.max(min, Math.round(data)));
};

const getDefaultCard = (cards: CardList, expectedType?: CardType) =>
    cards
        .getCards()
        .find(
            (card: Card) => !expectedType || card.getCardType() === expectedType
        );

const loadCard = (
    data: ParameterData,
    cards: CardList,
    expectedType?: CardType
) => {
    let result: Card;
    if (typeof data !== 'string') {
        return () => getDefaultCard(cards, expectedType);
    }
    result = cards.getCard(data);
    if (result.getCardType() !== expectedType) {
        return () => getDefaultCard(cards, expectedType);
    }
    const id = result.getDataId();
    return () => cards.getCard(id);
};

const parseResourceType = (data: ParameterData): string => {
    if (typeof data !== 'string') {
        return ResourceType.Synthesis;
    }
    switch (data) {
        case ResourceType.Decay:
            return ResourceType.Decay;
        case ResourceType.Growth:
            return ResourceType.Growth;
        case ResourceType.Renewal:
            return ResourceType.Renewal;
        case ResourceType.Synthesis:
            return ResourceType.Synthesis;
    }
    throw new Error();
};

const loadResource = (data: ParameterData) => {
    if (typeof data !== 'object') {
        return new Resource(1, 1);
    }
    return Resource.loadResource(data as ResourcePrototype);
};

const buildParameter = (
    type: ParameterType,
    data: ParameterData,
    cards: CardList
) => {
    switch (type) {
        case ParameterType.Integer:
            return parseInteger(data, -99, 99);
        case ParameterType.NaturalNumber:
            return parseInteger(data, 1, 99);
        case ParameterType.Resource:
            return loadResource(data);
        case ParameterType.ResourceType:
            return parseResourceType(data);
        case ParameterType.Card:
            return loadCard(data, cards);
        case ParameterType.Spell:
            return loadCard(data, cards, CardType.Spell);
        case ParameterType.Unit:
            return loadCard(data, cards, CardType.Unit);
        case ParameterType.Item:
            return loadCard(data, cards, CardType.Item);
        case ParameterType.Enchantment:
            return loadCard(data, cards, CardType.Enchantment);
        case ParameterType.CardType:
            return parseInteger(data, 0, 3);
    }
};

export const buildParameters = (
    types: ParameterType[],
    data: ParameterData[],
    cards: CardList
) => {
    const results = new Array(types.length);
    for (let i = 0; i < types.length; i++) {
        results[i] = buildParameter(types[i], data[i], cards);
    }
    return results;
};
