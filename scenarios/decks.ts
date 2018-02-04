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
    decks.push(Math.random() > 0.5 ? deckMap.get('skysAndSeas') : deckMap.get('mechanicalArmy'));
    return decks;
}

addDeck({
    name: 'March of Undeath',
    avatar: 'crowned-skull.png',
    customMetadata: true,
    records: [
        ['Skeleton', 4], ['CrawlingZombie', 4], ['Toxin', 3], ['RottingZombie', 4],
        ['Hemorrhage', 4], ['Decapitate', 4], ['DeathAscendancy', 4],
        ['RaiseSkeletons', 3], ['Abomination', 4], ['Lich', 4], ['Spectre', 2]
    ]
});

addDeck({
    name: 'Ancient Giants',
    avatar: 'hydra.png',
    customMetadata: true,
    records: [
        ['Dragon', 4], ['Hydra', 4], ['SnappingCobra', 4], ['Spiderling', 4],
        ['NaturesBounty', 4], ['Bear', 4], ['Minotaur', 4], ['Bite', 4],
        ['NeuralResonance', 2], ['Eruption', 2], ['SweetFragrance', 2], ['Kraken', 1], ['FireElemental', 1]
    ]
});

addDeck({
    name: 'The King’s Legions',
    avatar: 'throne-king.png',
    customMetadata: true,
    records: [
        ['Archer', 4], ['Pikeman', 4], ['Blacksmith', 4], ['Imprison', 4],
        ['Knight', 4], ['Recruitment', 4], ['General', 4], ['King', 4],
        ['SentryAngel', 4], ['CallOfJustice', 4]
    ]
});

addDeck({
    name: 'Skys and Seas',
    avatar: 'battleship.png',
    customMetadata: true,
    records: [
        ['SiegeArtillery', 4], ['ScoutGlider', 4], ['Airship', 4], ['Rifle', 4],
        ['ArchivesSearch', 4], ['GoldMine', 4], ['Submarine', 2], ['BombingRun', 4],
        ['Battleship', 2], ['Golem', 4], ['Spy', 4]
    ]
});

addDeck({
    'name': 'Mechanical Army',
    'avatar': 'android-mask.png',
    'customMetadata': true,
    'records': [
        ['Workbot', 4], ['AutomatedInfantry', 4], ['AssemblyLine', 4], ['SiegeArtillery', 4],
        ['Interceptor', 4], ['Golem', 4], ['ComsTower', 4], ['EnergyBeam', 2], ['AlloyTransmute', 2],
        ['Paragon', 4], ['RiftBlast', 2], ['TitanMk2', 2]
    ]
});

addDeck({
    'name': 'Agents of Decay',
    'avatar': 'hooded-assassin.png',
    'customMetadata': true,
    'records': [
        ['Imp', 4], ['Backstab', 4], ['VampireBat', 4], ['WhipOfTorment', 4],
        ['Saboteur', 4], ['Assassin', 4], ['NecromancerTome', 4], ['Toxin', 4],
        ['Vampire', 2], ['AssasinDagger', 2], ['Decapitate', 4]
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
        ['SupremeAgeis', 1], ['WingsOfLight', 1], ['Dawnbreak', 1],
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
        ['Flourishing', 4], ['AutomatedInfantry', 4], ['Golem', 4],
        ['Paragon', 4], ['NaturesBounty', 4], ['TitanMk2', 2],
        ['Eruption', 2], ['Workbot', 4]
    ]
});

addDeck({
    'name': 'Dominion',
    'avatar': 'meditation.png',
    'customMetadata': true,
    'records': [
        ['Armstice', 4], ['AncientSage', 2], ['AssemblyLine', 4], ['Dove', 4],
        ['ValiantDefenses', 4], ['Imprison', 4], ['CallOfJustice', 4], ['SentryAngel', 4],
        ['ArchivesSearch', 4], ['BombingRun', 2], ['GoldMine', 2], ['ObsesrvationBallon', 2]
    ]
})
