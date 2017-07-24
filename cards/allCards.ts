import { Card } from '../card';
import { makeDamageCard, makeBasicUnit } from './testCards';
import { wolfPup, spiderHatchling } from './growthCards';
import { armstice } from './renewalCards';


export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

allCards.set('DamageCard', makeDamageCard);
allCards.set('BasicUnit', makeBasicUnit);
allCards.set('WolfPup', wolfPup);
allCards.set('SpiderHatchling', spiderHatchling);
allCards.set('Armstice', armstice);
