import { Card } from '../card';
import { makeDamageCard, makeBasicUnit } from './testCards';
import { makeGrowth1, makeGrowth2 } from './growthCards';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

allCards.set('DamageCard', makeDamageCard);
allCards.set('BasicUnit', makeBasicUnit);
allCards.set('G1', makeGrowth1);
allCards.set('G2', makeGrowth2);
