import { Mechanic, TargetedMechanic, TriggeredMechanic } from '../../mechanic';
import { Game } from '../../game';
import { Targeter } from '../../targeter';
import { Card, GameZone, CardType } from '../../card';
import { Unit, UnitType } from '../../unit';


import { remove, take, sumBy } from 'lodash';
import { ParameterType } from '../parameters';
import { ChoiceHeuristic } from '../../ai';

export class TransformDamaged extends Mechanic {
    protected static id = 'TransformDamaged';
    protected static ParameterTypes = [
        { name: 'Transform Unit', type: ParameterType.Unit },
    ];

    private unitDesc: string;
    constructor(private transformation: () => Unit) {
        super();
        let unit = transformation();
        this.unitDesc = unit.getName();
    }

    public enter(card: Card, game: Game) {
        let unit = card as Unit;
        unit.getEvents().dealDamage.addEvent(this, async params => {
            let target = params.target;
            if (target.getUnitType() === UnitType.Player)
                return;
            target.transform(this.transformation(), game);
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Transform any unit this damages into a ${this.unitDesc}.`;
    }

    public evaluate() {
        return 6;
    }

    public getId() {
        return 'transfomTarget';
    }
}

export class AbominationConsume extends TriggeredMechanic {
    protected static id = 'AbominationConsume';
    protected static validCardTypes = new Set([CardType.Unit, CardType.Item]);

    public async onTrigger(card: Card, game: Game) {
        let crypt = game.getCrypt(card.getOwner());
        let valid = crypt.filter(cryptCard => cryptCard.isUnit());
        let unit = card as Unit;
        game.promptCardChoice(card.getOwner(), valid, 0, 2, (raised: Card[]) => {
            raised.forEach(toRaise => {
                let eaten = toRaise as Unit;
                unit.buff(eaten.getDamage(), eaten.getMaxLife());
                remove(crypt, eaten);
            });
        }, 'to combine',
            ChoiceHeuristic.HighestStatsHeuristic);
    }

    private getValidPool(card: Card, game: Game): Unit[] {
        return game.getCrypt(card.getOwner())
            .filter(cryptCard => cryptCard.isUnit()) as Unit[];
    }

    public getText(card: Card) {
        return `Remove up to two units from your crypt. This unit gains their stats.`;
    }

    public evaluateEffect(card: Card, game: Game) {
        if (card.getLocation() === GameZone.Board)
            return 0;
        let valid = this.getValidPool(card, game).sort((unitA, unitB) => unitB.getStats() - unitA.getStats());
        return sumBy(take(valid, 2), (unit) => unit.getStats());
    }
}
