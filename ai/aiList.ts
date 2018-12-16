import { ClientGame } from '../clientGame';
import { DeckList } from '../deckList';
import { AI } from './ai';

export interface AIConstructor {
    new(playerNumber: number, game: ClientGame, deck: DeckList): AI;
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
        return names.map(name => this.constructors.find(cstr => cstr.name === name));
    }
}

export const aiList = new AIList();
