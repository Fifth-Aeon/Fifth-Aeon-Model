import { Permanent } from '../../card-types/permanent';
import { Targeter } from '../../targeter';
import { Card } from 'app/game_model/card-types/card';
import { Game } from 'app/game_model/game';

export class AllPermanents extends Targeter {
    protected static id = 'AllPermanents';
    protected lastTargets: Array<Permanent> = [];
    public getText() {
        return 'all units and enchantments';
    }
    public getPronoun() {
        return 'them';
    }
    public needsInput() {
        return false;
    }
    public getTargets(card: Card, game: Game): Array<Permanent> {
        this.lastTargets = game.getBoard().getAllPermanents();
        return this.lastTargets;
    }
    public getLastTargets() {
        return this.lastTargets;
    }
}