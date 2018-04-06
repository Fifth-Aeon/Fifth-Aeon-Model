import { ResourcePrototype, Resource, ResourceType } from 'fifthaeon/resource';
import { CardList } from 'fifthaeon/cards/cardList';
import { CardType, Card } from 'fifthaeon/card';

export enum ParameterType {
    Integer, NaturalNumber,
    Resource, ResourceType,
    Card, Spell, Unit, Item, Enchantment, CardType
}

export type ParamaterData = number | string | ResourcePrototype;

const parseInteger = (data: ParamaterData, min: number, max: number) => {
    if (typeof data === 'string')
        data = parseInt(data, 10);
    if (typeof data !== 'number' || isNaN(data))
        return 1;
    return Math.min(max, Math.max(min, Math.round(data)));
};

const getDefaultCard = (cards: CardList, expectedType: CardType) =>
    cards.getCards().find(card => !expectedType || card.getCardType() === expectedType);

const loadCard = (data: ParamaterData, cards: CardList, expectedType: CardType) => {
    let result: Card;
    if (typeof data !== 'string')
        return () => getDefaultCard(cards, expectedType);
    result = cards.getCard(data);
    if (result.getCardType() !== expectedType)
        return () => getDefaultCard(cards, expectedType);
    const id = result.getDataId();
    return () => cards.getCard(id);
};

const parseResourceType = (data: ParamaterData) => {
    if (typeof data !== 'string')
        return ResourceType.Synthesis;
    return ResourceType[data];
};

const loadResource = (data: ParamaterData) => {
    if (typeof data !== 'object')
        return new Resource(1, 1);
    return Resource.loadResource(data as ResourcePrototype);
};

const buildParameter = (type: ParameterType, data: ParamaterData, cards: CardList) => {
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
            return loadCard(data, cards, null);
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

export const buildParameters = (types: ParameterType[], data: ParamaterData[], cards: CardList) => {
    const results = new Array(types.length);
    for (let i = 0; i < types.length; i++) {
        results[i] = buildParameter(types[i], data[i], cards);
    }
    return results;
};
