import { CardType } from '../card';
import { ParameterType } from './parameters';
import { Mechanic } from '../mechanic';

export interface MechanicConstructor {
    getId(): string;
    isValidParent(CardType: CardType): boolean;
    getParameterTypes(): { name: string, type: ParameterType }[];
    new(param1?: any, param2?: any): Mechanic;
}
