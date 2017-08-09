import { Card } from '../card';

import {values} from 'lodash';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

function addFactory(...factories: CardFactory[]) {
    for (let factory of factories) {
        allCards.set(factory().getDataId(), factory);
    }
}

import * as renewal from './renewalCards';
addFactory(...values(renewal)); 

import * as growth from './growthCards';
addFactory(...values(growth)); 

import * as decay from './decayCards';
addFactory(...values(decay)); 

import * as synthesis from './synthCards';
addFactory(...values(synthesis)); 
