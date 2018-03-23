

import { values } from 'lodash';
import { Mechanic } from '../mechanic';

import * as skills from './mechanics/skills';
import * as buffs from './mechanics/buff';

export interface MechanicData {
    id: string;
}

class MechanicList {
    private constructors: Map<string, SimpleMechanicConstructor> = new Map();

    public addConstructors(...constructors: SimpleMechanicConstructor[]) {
        for (let constructor of constructors) {
            let instance = new constructor();
            this.constructors.set(instance.getId(), constructor);
        }
    }

    public buildInstance(data: MechanicData) {
        let constructor = this.constructors.get(data.id);
        return new constructor();
    }

}

interface SimpleMechanicConstructor {
    new(): Mechanic;
}


export const mechanicList = new MechanicList();


mechanicList.addConstructors(...(values(skills) as SimpleMechanicConstructor[]));
