import { CardType } from '../card-types/card';
import { ParameterType } from './parameters';
import { Mechanic } from '../mechanic';

export interface MechanicConstructor {
    grantable?: true;
    getId(): string;
    isValidParent(CardType: CardType): boolean;
    getParameterTypes(): { name: string; type: ParameterType }[];
    new (param1?: any, param2?: any): Mechanic;
}
