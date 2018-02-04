import { Card } from '../card';

import { values } from 'lodash';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();
export const cardList = Array<Card>();

function addFactory(...factories: CardFactory[]) {
    for (let factory of factories) {
        let card = factory();
        allCards.set(card.getDataId(), factory);
        cardList.push(card);
    }
}

import * as renewal from './renewalCards';
addFactory(...(values(renewal) as CardFactory[]));

import * as growth from './growthCards';
addFactory(...(values(growth) as CardFactory[]));

import * as decay from './decayCards';
addFactory(...(values(decay) as CardFactory[]));

import * as synthesis from './synthCards';
addFactory(...(values(synthesis) as CardFactory[]));
