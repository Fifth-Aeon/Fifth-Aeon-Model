

import { values } from 'lodash';
import { Mechanic, TargetedMechanic, TriggeredMechanic } from '../mechanic';
import { CardType } from '../card';
import { CardData, CardList } from './cardList';

import { MechanicConstructor} from './mechanicConstructor';
import * as buff from './mechanics/buff';
import * as cantAttack from './mechanics/cantAttack';
import * as dealDamage from './mechanics/dealDamage';
import * as decaySpecials from './mechanics/decaySpecials';
import * as draw from './mechanics/draw';
import * as enchantmentCounters from './mechanics/enchantmentCounters';
import * as growthSpecials from './mechanics/growthSpecials';
import * as heal from './mechanics/heal';
// import * as lordship from './mechanics/lordship';
import * as mindControl from './mechanics/mindControl';
import * as playerAid from './mechanics/playerAid';
import * as poison from './mechanics/poison';
import * as removal from './mechanics/removal';
import * as returnFromCrypt from './mechanics/returnFromCrypt';
import * as shieldEnchantments from './mechanics/shieldEnchantments';
import * as shuffleIntoDeck from './mechanics/shuffleIntoDeck';
import * as skills from './mechanics/skills';
import * as sleep from './mechanics/sleep';
import * as summonUnits from './mechanics/summonUnits';
import * as synthSpecials from './mechanics/synthSpecials';
import { TargeterData, targeterList } from './targeterList';
import { triggerList, TriggerData } from './triggerList';
import { ParameterType, buildParameters } from './parameters';

export interface MechanicData {
    id: string;
    parameters: Array<any>;
    targeter?: TargeterData;
    trigger?: TriggerData;
}

class MechanicList {
    private constructors: Map<string, MechanicConstructor> = new Map();
    private constructorList: MechanicConstructor[] = [];

    public addConstructors(...constructors: MechanicConstructor[]) {
        for (let constructor of constructors) {
            this.constructorList.push(constructor);
            this.constructors.set(constructor.getId(), constructor);
        }
    }

    public buildInstance(data: MechanicData, cards: CardList) {
        const constructor = this.constructors.get(data.id);
        const paramTypes = constructor.getParameterTypes().map(param => param.type);
        const paramterValues = buildParameters(paramTypes, data.parameters, cards);
        const instance = new constructor(...paramterValues);
        if (constructor.prototype instanceof TriggeredMechanic && data.trigger)
            (instance as TargetedMechanic).setTrigger(triggerList.buildInstance(data.trigger));
        if (constructor.prototype instanceof TargetedMechanic && data.targeter && data.targeter.id !== 'Host')
            (instance as TargetedMechanic).setTargeter(targeterList.buildInstance(data.targeter));
        return instance;
    }

    public getConstructors(cardType: CardType) {
        return this.constructorList.filter(constructor => constructor.isValidParent(cardType));
    }

    public isTriggered(mechanic: MechanicData) {
        const constructor = this.constructors.get(mechanic.id);
        if (!constructor)
            return false;
        return constructor.prototype instanceof TriggeredMechanic;
    }

    public isTargeted(mechanic: MechanicData) {
        const constructor = this.constructors.get(mechanic.id);
        if (!constructor)
            return false;
        return constructor.prototype instanceof TargetedMechanic;
    }

    public isValid(cardData: CardData, mechanic: MechanicData) {
        const constructor = this.constructors.get(mechanic.id);
        if (!constructor)
            return false;
        return constructor.isValidParent(cardData.cardType);
    }

    public getParameters(mechanic: MechanicData) {
        const constructor = this.constructors.get(mechanic.id);
        if (!constructor)
            return [];
        return constructor.getParameterTypes();
    }

}


export const mechanicList = new MechanicList();
const sources = [
    skills, poison, buff, cantAttack, dealDamage, decaySpecials, draw, enchantmentCounters,
    growthSpecials, heal, mindControl, playerAid, removal,
    returnFromCrypt, shieldEnchantments, shuffleIntoDeck, sleep, summonUnits, synthSpecials
];
for (let source of sources) {
    mechanicList.addConstructors(...(values(source) as MechanicConstructor[]));
}
