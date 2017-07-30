import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Player} from '../../player';

export class RenewalMCTargeter extends Targeter {

    public getValidTargets(card: Card, game: Game) {
        let owner = game.getPlayer(card.getOwner());
        return game.getBoard()
            .getPlayerUnits(game.getOtherPlayerNumber(card.getOwner()))
            .filter(unit => 
                unit.getCost().getNumeric() < owner.getPool().getOfType('Renewal')
            )
    }
    public getText() {
        return 'target unit with cost less than your renewal';
    }
}

export class MindControl extends Mechanic {
    constructor(private targeter:Targeter) {
        super();
    }

    public run(card: Card, game: Game) {
        let targets = this.targeter.getTargets(card, game);
        for (let target of targets) {
            let enemyBoard = game.getBoard().getPlayerUnits(target.getOwner());
            let ourBoard = game.getBoard().getPlayerUnits(card.getOwner());

            enemyBoard.splice(enemyBoard.indexOf(target));
            ourBoard.push(target);
        }
    }

    public getText(card: Card) {
        return `Take control of ${this.targeter.getText()}.`
    }
}
