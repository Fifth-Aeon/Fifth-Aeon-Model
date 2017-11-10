import { Card } from '../card';

import { values } from 'lodash';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

function addFactory(...factories: CardFactory[]) {
    for (let factory of factories) {
        allCards.set(factory().getDataId(), factory);
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
