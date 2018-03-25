import { Card, CardType } from '../card';
import { Resource, ResourcePrototype } from '../resource';
import { MechanicData, mechanicList } from './mechanicList';
import { Unit, UnitType } from '../unit';
import { Untargeted } from './targeters/basicTargeter';
import { targeterList, TargeterData } from './targeterList';

import { values } from 'lodash';

import * as renewal from './renewalCards';
import * as growth from './growthCards';
import * as decay from './decayCards';
import * as synthesis from './synthCards';

export interface CardData {
    id: string;
    cardType: CardType;
    name: string;
    imageUrl: string;
    targeter: TargeterData;
    mechanics: MechanicData[];
    cost: ResourcePrototype;
}

export interface UnitData extends CardData {
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
        const factory = this.buildUnitFactory(data);
        this.addFactory(factory);
    }

    public buildUnitInstance(data: UnitData) {
        return this.buildUnitFactory(data)();
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
        return this.factories.get(id);
    }

    private buildUnitFactory(data: UnitData) {
        return () => {
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
    }

}

export const cardList = new CardList();

cardList.addFactory(...(values(renewal) as CardFactory[]));
cardList.addFactory(...(values(growth) as CardFactory[]));
cardList.addFactory(...(values(decay) as CardFactory[]));
cardList.addFactory(...(values(synthesis) as CardFactory[]));
