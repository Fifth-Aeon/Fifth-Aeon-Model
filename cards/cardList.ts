
import { values } from 'lodash';
import { Card, CardType } from '../card';
import { Enchantment } from '../enchantment';
import { Item } from '../item';
import { Resource, ResourcePrototype } from '../resource';
import { Unit, UnitType } from '../unit';
import * as decay from './decayCards';
import * as growth from './growthCards';
import { MechanicData, mechanicList } from './mechanicList';
import * as renewal from './renewalCards';
import * as synthesis from './synthCards';
import { TargeterData, targeterList } from './targeterList';



export interface SpellData {
    id: string;
    cardType: CardType;
    name: string;
    imageUrl: string;
    targeter: TargeterData;
    mechanics: MechanicData[];
    cost: ResourcePrototype;
}

export interface UnitData extends SpellData {
    life: number;
    damage: number;
    type: UnitType;
}

export interface ItemData extends SpellData {
    life: number;
    damage: number;
    hostTargeter: TargeterData;
}

export interface EnchantmentData extends SpellData {
    power: number;
    empowerCost: number;
}

export type CardData = SpellData | UnitData | ItemData | EnchantmentData;

export type CardFactory = () => Card;

export class CardList {
    private factories = new Map<string, CardFactory>();
    private instances: Card[] = [];

    public loadCard(data: CardData) {
        const factory = this.buildCardFactory(data);
        this.addFactory(factory);
    }

    public buildInstance(data: CardData) {
        return this.buildCardFactory(data)();
    }

    public addFactory(...factories: CardFactory[]) {
        for (let factory of factories) {
            let card = factory();
            this.factories.set(card.getDataId(), factory);
            this.instances.push(card);
        }
    }

    public getCard(id: string): Card {
        const factory = this.factories.get(id);
        if (factory)
            return factory();
        console.error('No card with id', id);
        const first = this.factories.values().next().value;
        return first();
    }

    public getCards() {
        return this.instances;
    }

    public getIds() {
        return this.instances.map(instance => instance.getId());
    }

    public exists(id: string) {
        return this.factories.has(id);
    }

    public getCardFactory(id: string) {
        return this.factories.get(id);
    }

    public buildCardFactory(data: CardData) {
        switch (data.cardType) {
            case CardType.Spell:
                return this.buildSpellFactory(data as SpellData);
            case CardType.Unit:
                return this.buildUnitFactory(data as UnitData);
            case CardType.Item:
                return this.buildItemFactory(data as ItemData);
            case CardType.Enchantment:
                return this.buildEnchantmentFactory(data as EnchantmentData);
        }
    }

    private buildSpellFactory(data: SpellData) {
        return () => {
            return new Card(
                data.id,
                data.name,
                data.imageUrl,
                Resource.loadResource(data.cost),
                targeterList.buildInstance(data.targeter),
                data.mechanics.map(mechanic => mechanicList.buildInstance(mechanic, this))
            );
        };
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
                data.mechanics.map(mechanic => mechanicList.buildInstance(mechanic, this))
            );
        };
    }

    private buildItemFactory(data: ItemData) {
        return () => {
            return new Item(
                data.id,
                data.name,
                data.imageUrl,
                Resource.loadResource(data.cost),
                targeterList.buildInstance(data.targeter),
                targeterList.buildInstance(data.hostTargeter),
                data.damage,
                data.life,
                data.mechanics.map(mechanic => mechanicList.buildInstance(mechanic, this))
            );
        };
    }

    private buildEnchantmentFactory(data: EnchantmentData) {
        return () => {
            return new Enchantment(
                data.id,
                data.name,
                data.imageUrl,
                Resource.loadResource(data.cost),
                targeterList.buildInstance(data.targeter),
                data.empowerCost,
                data.power,
                data.mechanics.map(mechanic => mechanicList.buildInstance(mechanic, this))
            );
        };
    }

}

export const cardList = new CardList();

cardList.addFactory(...(values(renewal) as CardFactory[]));
cardList.addFactory(...(values(growth) as CardFactory[]));
cardList.addFactory(...(values(decay) as CardFactory[]));
cardList.addFactory(...(values(synthesis) as CardFactory[]));
