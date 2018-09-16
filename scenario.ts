import { Card } from './card';
import { Game } from './game';
import { Permanent } from './permanent';
import { DeckList } from './deckList';

interface ScenarioPlayer {
    initialPermanents: Permanent[];
    lifeTotals: number;
    initalHands: Card[];
    deck?: DeckList;
}
export interface ScenarioData {
    name: string;
    description: string;
    playerSetups: [ScenarioPlayer, ScenarioPlayer];
}

export class Scenario {
    private  playerSetups: [ScenarioPlayer, ScenarioPlayer];
    constructor(data: ScenarioData) {
        this.playerSetups = data.playerSetups;
    }

    public apply(game: Game) {
        for (let playerNumber = 0; playerNumber < 2; playerNumber++) {
            let player = game.getPlayer(playerNumber);
            player.addLife(this.playerSetups[playerNumber].lifeTotals - player.getLife());

            for (let permanent of this.playerSetups[playerNumber].initialPermanents) {
                game.addCardToPool(permanent);
                player.drawGeneratedCard(permanent);
                game.playCard(player, permanent);
            }
            for (let card of this.playerSetups[playerNumber].initalHands) {
                game.addCardToPool(card);
                player.drawGeneratedCard(card);
            }
        }
    }
}
