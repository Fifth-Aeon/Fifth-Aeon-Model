import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';

export class ShuffleIntoDeck extends Mechanic {
    constructor(private targeter) {
        super();
    }

    public run(card: Card, game: Game) {
        let targets = this.targeter.getTargets(game);
        for (let target of targets) {
            let owner = game.getPlayer(target.getOwner());
            let board = game.getBoard().getPlayerUnits(target.getOwner());

            board.splice(board.indexOf(target));
            owner.addToDeck(target);
        }
    }

    public getText(card: Card) {
        return `Shuffle ${this.targeter.getText()} into their owner's deck.`
    }
}
