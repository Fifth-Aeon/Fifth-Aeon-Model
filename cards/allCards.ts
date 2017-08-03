import { Card } from '../card';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

function addFactory(factory: CardFactory) {
    allCards.set(factory().getDataId(), factory);
}

import { makeDamageCard, makeBasicUnit } from './testCards';
addFactory(makeDamageCard);
//addFactory(makeBasicUnit);

import { armstice, callOfJustice, ruralMonk, monestary, castle } from './renewalCards';
addFactory(armstice);
addFactory(callOfJustice);
addFactory(ruralMonk);
addFactory(monestary);
addFactory(castle);

import { wolfPup, spiderHatchling, venomousSpiderling } from './growthCards';
addFactory(wolfPup);
addFactory(spiderHatchling);
addFactory(venomousSpiderling);

import { princeOfDecay, poison, crawlingZombie, unbury } from './decayCards';
addFactory(princeOfDecay);
addFactory(poison);
addFactory(crawlingZombie);
addFactory(unbury);

import { insight, mine } from './synthCards';
addFactory(insight);
addFactory(mine);