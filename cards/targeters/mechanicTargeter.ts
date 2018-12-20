import { Card } from '../../card';
import { Game } from '../../game';
import { Targeter } from '../../targeter';

export class UnitWithAbility extends Targeter {
    protected static id = 'UnitWithAbility';
    constructor(private abilityId: string, private desc: string) {
        super();
    }
    public getValidTargets(card: Card, game: Game) {
        return game
            .getBoard()
            .getAllUnits()
            .filter(unit => unit.hasMechanicWithId(this.abilityId));
    }
    public getText() {
        return `target ${this.desc} unit`;
    }
}
