import { Card } from '../../card';
import { Game } from '../../game';
import { Targeter } from '../../targeter';

export class DamagedUnit extends Targeter {
    protected static id = 'DamagedUnit';
    public getValidTargets(card: Card, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.getLife() < unit.getMaxLife());
    }
    public getText() {
        return 'target damaged unit';
    }
}
