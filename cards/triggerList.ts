

import { values } from 'lodash';
import { CardType } from '../card';
import { CardData } from 'fifthaeon/cards/cardList';
import { TargeterData, targeterList } from 'fifthaeon/cards/targeterList';
import { Trigger } from 'fifthaeon/trigger';

import * as affinity from 'fifthaeon/cards/triggers/affinity';
import * as basic from 'fifthaeon/cards/triggers/basic';
import * as death from 'fifthaeon/cards/triggers/death';
import * as lethalStrike from 'fifthaeon/cards/triggers/lethalStrike';
import * as owner from 'fifthaeon/cards/triggers/owner';
import * as serenity from 'fifthaeon/cards/triggers/serenity';

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
const sources = [affinity, basic, death, lethalStrike, owner, serenity];
for (let source of sources) {
    triggerList.addConstructors(...(values(source) as TriggerConstructor[]));
}
