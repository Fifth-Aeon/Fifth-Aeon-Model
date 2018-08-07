import { Card } from './card';
import { Game } from './game';
import { Permanent } from './permanent';

export interface ScenarioData {
    initialPermanents: [Permanent[], Permanent[]];
    lifeTotals: [number, number];
    initalHands: [Card[], Card[]];
}

export class Scenario {
    private initialPermanents: [Permanent[], Permanent[]];
    private lifeTotals: [number, number];
    private initalHands: [Card[], Card[]];

    constructor(data: ScenarioData) {
        this.initialPermanents = data.initialPermanents;
        this.lifeTotals = data.lifeTotals;
        this.initalHands = data.initalHands;
    }

    public apply(game: Game) {
        for (let playerNumber = 0; playerNumber < 2; playerNumber++) {
            let player = game.getPlayer(playerNumber);
            player.addLife(this.lifeTotals[playerNumber] - player.getLife());

            for (let permanent of this.initialPermanents[playerNumber]) {
                game.playCard(player, permanent);
            }
            for (let card of this.initalHands[playerNumber]) {
                player.drawGeneratedCard(card);
            }
        }
    }
}
