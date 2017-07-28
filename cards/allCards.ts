import { Card } from '../card';
import { makeDamageCard, makeBasicUnit } from './testCards';
import { wolfPup, spiderHatchling, venomousSpiderling } from './growthCards';
import { armstice } from './renewalCards';
import { princeOfDecay } from './decayCards';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

function addFactory(factory: CardFactory) {
    allCards.set(factory().getDataId(), factory);
}

//addFactory(makeDamageCard);
//addFactory(makeBasicUnit);

addFactory(armstice);

addFactory(wolfPup);
addFactory(spiderHatchling);
addFactory(venomousSpiderling);

addFactory(princeOfDecay);