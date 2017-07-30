import { Card } from '../card';
import { makeDamageCard, makeBasicUnit } from './testCards';
import { wolfPup, spiderHatchling, venomousSpiderling } from './growthCards';
import { armstice, callOfJustice } from './renewalCards';
import { princeOfDecay, poison, crawlingZombie } from './decayCards';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

function addFactory(factory: CardFactory) {
    allCards.set(factory().getDataId(), factory);
}

addFactory(makeDamageCard);
//addFactory(makeBasicUnit);

addFactory(armstice);
addFactory(callOfJustice);

addFactory(wolfPup);
addFactory(spiderHatchling);
addFactory(venomousSpiderling);

addFactory(princeOfDecay);
addFactory(poison);
addFactory(crawlingZombie);