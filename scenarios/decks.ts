import { DeckList, SavedDeck } from '../deckList';
import { standardFormat } from '../gameFormat';
import { camelCase } from 'lodash';

export const allDecks: DeckList[] = [];
export const deckMap = new Map<string, DeckList>();

function addDeck(deck: SavedDeck) {
    let list = new DeckList(standardFormat);
    list.fromSavable(deck);
    allDecks.push(list)
    deckMap.set(camelCase(deck.name), list);
}

export function getStarterDecks() {
    let decks = [];
    decks.push(Math.random() > 0.5 ? deckMap.get('marchOfUndeath') : deckMap.get('agentsOfDecay'));
    decks.push(Math.random() > 0.5 ? deckMap.get('theKingsLegions') : deckMap.get('clericalOrder'));
    decks.push(Math.random() > 0.5 ? deckMap.get('ancientGiants') : deckMap.get('primalSwarm'));
    decks.push(Math.random() > 0.5 ? deckMap.get('skysAndSeas') : deckMap.get('mechanicalLegions'));
    return decks;
}

addDeck({
    name: 'March of Undeath',
    avatar: 'crowned-skull.png',
    customMetadata: true,
    records: [
        ['Skeleton', 4], ['CrawlingZombie', 4], ['Poison', 3], ['RottingZombie', 4],
        ['Hemorrhage', 4], ['Decapitate', 4], ['DeathAscendancy', 4],
        ['raiseSeeleton', 3], ['Abomination', 4], ['Lich', 4], ['Spectre', 2]
    ]
});

addDeck({
    name: 'Ancient Giants',
    avatar: 'hydra.png',
    customMetadata: true,
    records: [
        ['Dragon', 4], ['Three headed Hydra', 4], ['Cobra', 4], ['Spiderling', 4],
        ['NaturesBounty', 4], ['Bear', 4], ['Minotaur', 4], ['bite', 4],
        ['NeuralResonance', 2], ['Eruption', 2], ['SweetFragrance', 2], ['Kraken', 1], ['Fire Elemental', 1]
    ]
});

addDeck({
    name: 'The King’s Legions',
    avatar: 'throne-king.png',
    customMetadata: true,
    records: [
        ['Archer', 4], ['Pikeman', 4], ['blacksmith', 4], ['Imprison', 4],
        ['Knight', 4], ['recruitment', 4], ['General', 4], ['king', 4],
        ['SentryAngel', 4], ['CallOfJustice', 4]
    ]
});

addDeck({
    name: 'Skys and Seas',
    avatar: 'battleship.png',
    customMetadata: true,
    records: [
        ['siegeArtillery', 4], ['Hanglider', 4], ['Airship', 4], ['Rifle', 4],
        ['archivesSearch', 4], ['Mine', 4], ['Submarine', 2], ['BombingRun', 4],
        ['Battleship', 2], ['golem', 4], ['spy', 4]
    ]
});

addDeck({
    'name': 'Mechanical Army',
    'avatar': 'android-mask.png',
    'customMetadata': true,
    'records': [
        ['workbot', 4], ['automatedInfantry', 4], ['AssemblyLine', 4], ['siegeArtillery', 4],
        ['interceptor', 4], ['golem', 4], ['ComsTower', 4], ['EnergyBeam', 2], ['alloyTransmute', 2],
        ['paragon', 4], ['riftBlast', 2], ['titanmk2', 2]
    ]
});

addDeck({
    'name': 'Agents of Decay',
    'avatar': 'hooded-assassin.png',
    'customMetadata': true,
    'records': [
        ['Imp', 4], ['Backstab', 4], ['VampireBat', 4], ['WhipOfTorrment', 4],
        ['Saboteur', 4], ['Assassin', 4], ['NecromancerTome', 4], ['Poison', 4],
        ['Vampire1', 2], ['AssasinDagger', 2], ['Decapitate', 4]
    ]
});

addDeck({
    'name': 'Clerical Order',
    'avatar': 'meditation.png',
    'customMetadata': true,
    'records': [
        ['RuralMonk', 4], ['Dove', 4], ['NavalGalley', 4],
        ['Imprison', 4], ['Pontiff', 4], ['CallOfJustice', 4],
        ['Monastery', 4], ['SentryAngel', 4], ['AncientSage', 4],
        ['SupremeAgeis', 1], ['WingsOfLight', 1], ['dawnbreak', 1],
        ['Armstice', 1]
    ]
});

addDeck({
    'name': 'Primal Swarm',
    'avatar': 'hanging-spider.png',
    'customMetadata': true,
    'records': [
        ['Spiderling', 4], ['SpiderHatchling', 4], ['Wasp', 4],
        ['WolfPup', 4], ['Werewolf', 4], ['WolfHowl', 4],
        ['SpiderQueen', 4], ['SweetFragrance', 4], ['GiantClub', 4],
        ['Bear', 4]
    ]
});

addDeck({
    'name': 'Robotic Plague',
    'avatar': 'virus.png',
    'customMetadata': true,
    'records': [
        ['AssemblyLine', 4], ['ForceField', 4], ['DeadlyPlague', 4],
        ['Flourishing', 4], ['automatedInfantry', 4], ['golem', 4],
        ['paragon', 4], ['NaturesBounty', 4], ['titanmk2', 2],
        ['Eruption', 2], ['workbot', 4]
    ]
});

addDeck({
    'name': 'Dominion',
    'avatar': 'meditation.png',
    'customMetadata': true,
    'records': [
        ['Armstice', 4], ['AncientSage', 2], ['AssemblyLine', 4], ['Dove', 4],
        ['valiantDefenses', 4], ['Imprison', 4], ['CallOfJustice', 4], ['SentryAngel', 4],
        ['archivesSearch', 4], ['BombingRun', 2], ['Mine', 2], ['ObsesrvationBallon', 2]
    ]
})
