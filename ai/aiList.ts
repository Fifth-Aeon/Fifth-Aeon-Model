import { ClientGame } from '../clientGame';
import { DeckList } from '../deckList';
import { AI } from './ai';
import { DeckBuilder } from './deckBuilder';

export interface AIConstructor {
    new (playerNumber: number, game: ClientGame, deck: DeckList): AI;
    /** Returns a deck builder instance to builde the A.Is deck for a limited match */
    getDeckbuilder(): DeckBuilder;
}

class AIList {
    private constructors: AIConstructor[] = [];

    public registerConstructor(constructor: AIConstructor) {
        this.constructors.push(constructor);
    }

    public getConstructors(): AIConstructor[] {
        return [...this.constructors];
    }

    public getConsturctorNames(): string[] {
        return this.constructors.map(cnstr => cnstr.name);
    }

    public getConstructorsByName(names: string[]): AIConstructor[] {
        return names.map(name => {
            const constructor = this.constructors.find(
                cstr => cstr.name === name
            );
            if (!constructor) {
                throw new Error(`No A.I constructor found named ${name}`);
            }
            return constructor;
        });
    }
}

export const aiList = new AIList();
