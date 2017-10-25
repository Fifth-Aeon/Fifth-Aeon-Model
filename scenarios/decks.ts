import { DeckList, SavedDeck } from '../decklist';
import { standardFormat } from '../gameFormat';
import { camelCase } from 'lodash';

export const deckLists: DeckList[] = [];
export const deckMap = new Map<string, DeckList>();

function addDeck(deck: SavedDeck) {
    let list = new DeckList(standardFormat);
    list.fromSavable(deck);
    deckLists.push(list)
    deckMap.set(camelCase(deck.name), list);
}

addDeck({
    name: 'March of Undeath',
    avatar: 'crowned-skull.png',
    customMetadata: true,
    records: [
        ["Skeleton", 4], ["CrawlingZombie", 4], ["Poison", 3], ["RottingZombie", 4],
        ["Hemorrhage", 4], ["Decapitate", 4], ["DeathAscendancy", 4],
        ["raiseSeeleton", 3], ["Abomination", 4], ["Lich", 4], ["Spectre", 2]
    ]
});

addDeck({
    name: 'Ancient Giants',
    avatar: 'hydra.png',
    customMetadata: true,
    records: [
        ["Dragon", 4], ["Three headed Hydra", 4], ["Cobra", 4], ["Spiderling", 4],
        ["NaturesBounty", 4], ["Bear", 4], ["Minotaur", 4], ["bite", 4],
        ["NeuralResonance", 2], ["Eruption", 2], ["SweetFragrance", 2], ["Kraken", 1], ["Fire Elemental", 1]
    ]
});

addDeck({
    name: "The King’s Legions",
    avatar: "throne-king.png",
    customMetadata: true,
    records: [
        ["Archer", 4], ["Pikeman", 4], ["blacksmith", 4], ["Imprison", 4],
        ["Knight", 4], ["recruitment", 4], ["General", 4], ["king", 4],
        ["SentryAngel", 4], ["CallOfJustice", 4]
    ]
});

addDeck({
    name: "Rapid Responce",
    avatar: "battleship.png",
    customMetadata: true,
    records: [
        ["siegeArtillery", 4], ["Hanglider", 4], ["Airship", 4], ["Rifle", 4],
        ["archivesSearch", 4], ["Mine", 4], ["Submarine", 2], ["BombingRun", 4],
        ["Battleship", 2], ["golem", 4], ["spy", 4]
    ]
});





