import { Card } from '../card';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

function addFactory(...factories: CardFactory[]) {
    for (let factory of factories) {
        allCards.set(factory().getDataId(), factory);
    }
}

import { makeDamageCard, makeBasicUnit } from './testCards';
addFactory(makeDamageCard);
//addFactory(makeBasicUnit);

import { armstice, callOfJustice, ruralMonk, monestary, castle, plaugeDoctor, knight } from './renewalCards';
addFactory(armstice, callOfJustice, ruralMonk, monestary, castle, plaugeDoctor, knight);

import { wolfPup, spiderHatchling, venomousSpiderling, werewolf, wasp, dragon } from './growthCards';
addFactory(wolfPup, spiderHatchling, venomousSpiderling, werewolf, wasp, dragon);

import { princeOfDecay, poison, crawlingZombie, unbury, vampire, bat } from './decayCards';
addFactory(princeOfDecay, poison, crawlingZombie, unbury, vampire, bat);

import { insight, mine, observationBallon, hanglider, airship } from './synthCards';
addFactory(insight, mine, observationBallon, hanglider, airship);