import { Card } from '../card';
import { makeDamageCard, makeBasicUnit } from './testCards';

export type CardFactory = () => Card;

export const allCards = new Map<string, CardFactory>();

allCards.set('DamageCard', makeDamageCard);
allCards.set('BasicUnit', makeBasicUnit);