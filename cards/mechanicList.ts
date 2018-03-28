

import { values } from 'lodash';
import { Mechanic } from '../mechanic';

import * as skills from './mechanics/skills';
import * as buffs from './mechanics/buff';
import { CardType } from '../card';

export interface MechanicData {
    id: string;
}

class MechanicList {
    private constructors: Map<string, SimpleMechanicConstructor> = new Map();
    private constructorList: SimpleMechanicConstructor[] =  [];

    public addConstructors(...constructors: SimpleMechanicConstructor[]) {
        for (let constructor of constructors) {
            let instance = new constructor();
            constructor.id = instance.getId();
            constructor.validCardTypes = instance.getValidCardTypes();
            this.constructorList.push(constructor);
            this.constructors.set(constructor.id, constructor);
        }
    }

    public buildInstance(data: MechanicData) {
        let constructor = this.constructors.get(data.id);
        return new constructor();
    }

    public getConstructors(cardType: CardType) {
        return this.constructorList.filter(constructor => constructor.validCardTypes.has(cardType));
    }

}

interface SimpleMechanicConstructor {
    id?: string;
    validCardTypes?: Set<CardType>;
    new(): Mechanic;
}


export const mechanicList = new MechanicList();


mechanicList.addConstructors(...(values(skills) as SimpleMechanicConstructor[]));
