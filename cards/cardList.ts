import { Card } from '../card';
import { Resource, ResourcePrototype } from '../resource';
import { MechanicData, mechanicList } from './mechanicList';
import { Unit, UnitType } from '../unit';
import { Untargeted } from './targeters/basicTargeter';
import { targeterList, TargeterData } from './targeterList';

import { values } from 'lodash';

interface CardData {
    id: string;
    name: string;
    imageUrl: string;
    targeter: TargeterData;
    mechanics: MechanicData[];
    cost: ResourcePrototype;
}

interface UnitData extends CardData {
    life: number;
    damage: number;
    type: UnitType;
}

export type CardFactory = () => Card;

class CardList {
    private factories = new Map<string, CardFactory>();
    private instances: Card[] = [];

    public loadCard(data: CardData) {
        const factory = () => {
            return new Card(
                data.id,
                data.name,
                data.imageUrl,
                Resource.loadResource(data.cost),
                targeterList.buildInstance(data.targeter),
                data.mechanics.map(mechanic => mechanicList.buildInstance(mechanic))
            );
        };
        this.addFactory(factory);
    }

    public loadUnit(data: UnitData) {
        const factory = () => {
            return new Unit(
                data.id,
                data.name,
                data.imageUrl,
                data.type,
                Resource.loadResource(data.cost),
                targeterList.buildInstance(data.targeter),
                data.damage,
                data.life,
                data.mechanics.map(mechanic => mechanicList.buildInstance(mechanic))
            );
        };
        this.addFactory(factory);
        console.log('fs', data.id, factory, factory());
    }

    public addFactory(...factories: CardFactory[]) {
        for (let factory of factories) {
            let card = factory();
            this.factories.set(card.getDataId(), factory);
            this.instances.push(card);
        }
    }

    public getCard(id: string) {
        return this.factories.get(id)();
    }

    public getCards() {
        return this.instances;
    }

    public getIds() {
        return this.instances.map(instance => instance.getId());
    }

    public exists(id) {
        return this.factories.has(id);
    }

    public getCardFactory(id) {
        return this.factories.get(id)();
    }

}



export const cardList = new CardList();


cardList.loadUnit(
    {
        name: 'A',
        id: 'A',
        imageUrl: '',
        cost: {
            energy: 1,
            synthesis: 1
        },
        mechanics: [{ id: 'flying' }],
        targeter: { id: 'Untargeted' },
        life: 1,
        damage: 1,
        type: UnitType.Agent
    }
);

import * as renewal from './renewalCards';
cardList.addFactory(...(values(renewal) as CardFactory[]));

import * as growth from './growthCards';
cardList.addFactory(...(values(growth) as CardFactory[]));

import * as decay from './decayCards';
cardList.addFactory(...(values(decay) as CardFactory[]));

import * as synthesis from './synthCards';
cardList.addFactory(...(values(synthesis) as CardFactory[]));

