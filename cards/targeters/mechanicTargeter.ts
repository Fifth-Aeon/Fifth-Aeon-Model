import { Targeter, AllUnits } from '../../targeter';
import { Card } from '../../card';
import { Unit } from '../../unit';
import { Game } from '../../game';

export class UnitWithAbility extends Targeter {
    constructor(private abilityId: string, private desc: string) {
        super();
    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.hasMechanicWithId(this.abilityId));
    }
    public getText() {
        return `target ${this.desc} unit`;
    }
}


export class PoisonableUnits extends AllUnits {
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => !unit.isImmune('poisoned'));
        return this.lastTargets;
    }
    public getText() {
        return 'all units';
    }
}
