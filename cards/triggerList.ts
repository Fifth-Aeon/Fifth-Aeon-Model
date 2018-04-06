

import * as affinity from './triggers/affinity';
import * as basic from './triggers/basic';
import * as death from './triggers/death';
import * as lethalStrike from './triggers/lethalStrike';
import * as owner from './triggers/owner';
import * as periodic from './triggers/periodic';
import * as serenity from './triggers/serenity';
import { Trigger } from '../trigger';
import { values } from 'lodash';



export interface TriggerData {
    id: string;
}

class TriggerList {
    private constructors: Map<string, TriggerConstructor> = new Map();
    private constructorList: TriggerConstructor[] = [];

    public addConstructors(...constructors: TriggerConstructor[]) {
        for (let constructor of constructors) {
            this.constructorList.push(constructor);
            this.constructors.set(constructor.getId(), constructor);
        }
    }

    public buildInstance(data: TriggerData) {
        const constructor = this.constructors.get(data.id);
        const instance = new constructor();
        return instance;
    }

    public getIds() {
        return this.constructorList.map(constr => constr.getId());
    }

}

interface TriggerConstructor {
    getId(): string;
    new(): Trigger;
}

export const triggerList = new TriggerList();
const sources = [basic, death, periodic, owner, lethalStrike, serenity, affinity];
for (let source of sources) {
    triggerList.addConstructors(...(values(source) as TriggerConstructor[]));
}
