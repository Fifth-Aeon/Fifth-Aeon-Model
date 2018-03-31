

import { values } from 'lodash';
import { Mechanic } from '../mechanic';
import { Targeter } from '../targeter';


import * as biotargeters from './targeters/biotargeter';
import * as basicTargeters from './targeters/basicTargeter';
import * as mechanicTargeters from './targeters/mechanicTargeter';
import * as poisonTargeter from './targeters/poisonTargeter';
import * as powerTargeter from './targeters/powerTargeter';
import * as unitTypeTargeter from './targeters/unitTypeTargeter';
import * as weakenedUnits from './targeters/weakenedUnits';

const targeterGroups = [biotargeters, basicTargeters, mechanicTargeters, poisonTargeter, powerTargeter, unitTypeTargeter, weakenedUnits];

export interface TargeterData {
    id: string;
    optional: boolean;
}

class TargeterList {
    private constructors: Map<string, TargeterConstructor> = new Map();
    private constructorList: TargeterConstructor[] = [];

    public addConstructors(...constructors: TargeterConstructor[]) {
        for (let constructor of constructors) {
            const instance = new constructor();
            const id = constructor.getId();
            if (this.constructors.has(id))
                console.warn('Warning, overwrting targeter ID', id);
            this.constructors.set(id, constructor);
            this.constructorList.push(constructor);
        }
    }

    public buildInstance(data: TargeterData) {
        let constructor = this.constructors.get(data.id);
        if (!constructor) {
            console.warn('No targeter with ID', data.id);
            constructor = basicTargeters.Untargeted;
        }
        const instance = new constructor();
        instance.setOptional(data.optional);
        return instance;
    }

    public getIds(passiveOnly = false) {
        if (passiveOnly)
            return this.constructorList
            .filter(constructor => !new constructor().needsInput())
            .map(constr => constr.getId());
        return this.constructorList.map(constr => constr.getId());
    }

}

interface TargeterConstructor {
    getId(): string;
    new(): Targeter;
}


export const targeterList = new TargeterList();
for (let targeterGroup of targeterGroups) {
    targeterList.addConstructors(...(values(targeterGroup) as TargeterConstructor[]));
}

