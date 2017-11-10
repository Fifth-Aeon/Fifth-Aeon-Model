import { Resource, ResourceType, ResourceTypeGroup } from './resource';

export class GameFormat {
    public name = 'Standard';
    public zoneNames: ['Board', 'Hand', 'Crypt'];

    // General Gameplay
    public boardSize = 7;
    public playerCount = 2; // Number of players in format
    public rarityNames: string[] = ['Common', 'Rare', 'Epic', 'Legendary'];
    public basicResources: Map<string, Resource> = new Map<string, Resource>();

    // Starting Values
    public initialDraw: number[] = [3, 4]; // Number of cards each player draws on turn 1
    public initialLife: number[] = [25, 25]; // Number of life each player gets on turn 1
    public initalResource: Resource[] = [new Resource(0), new Resource(0)];

    // Deckbuilding rules
    public minDeckSize = 40;
    public maxDeckSize = 50;
    public cardsOfRarity = [4, 4, 4, 4];

    constructor() {
        this.basicResources.set('basic', new Resource(1));
        for (let resourceName of Object.keys(ResourceType)) {
            let types = { Synthesis: 0, Growth: 0, Decay: 0, Renewal: 0 } as ResourceTypeGroup;
            types[resourceName] = 1;
            this.basicResources.set(resourceName, new Resource(1, 1, types));
        }
    }
}

export const standardFormat = new GameFormat();
