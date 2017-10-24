import { Mechanic } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card, CardType } from '../../card';
import { Enchantment } from '../../enchantment';
import { GameEvent, EventType } from '../../gameEvent';

export class Recharge extends Mechanic {
    protected validCardTypes = new Set([CardType.Enchantment]);

    constructor(protected amountPerTurn: number) {
        super();
    }

    public run(card: Card, game: Game) {
        let enchantment = card as Enchantment;
        game.gameEvents.addEvent(null, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == enchantment.getOwner())
                enchantment.changePower(this.amountPerTurn);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Recharge (${this.amountPerTurn}).`;
    }

    public evaluate() {
        return this.amountPerTurn * 1;
    }
}

export class Discharge extends Recharge {
    public run(card: Card, game: Game) {
        let enchantment = card as Enchantment;
        game.gameEvents.addEvent(null, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == enchantment.getOwner())
                enchantment.changePower(-this.amountPerTurn);
            return params;
        }));
    }

    public remove(card: Card, game: Game) {
        game.gameEvents.removeEvents(this);
    }

    public getText(card: Card) {
        return `Discharge (${this.amountPerTurn}).`;
    }

    public evaluate() {
        return this.amountPerTurn * -1;
    }
}

export class CannotBeEmpowered extends Mechanic {
    protected validCardTypes = new Set([CardType.Enchantment]);
    
    public run(card: Card, game: Game) {
        (card as Enchantment).setEmpowerable(false);
    }

    public remove(card: Card, game: Game) {
        (card as Enchantment).setEmpowerable(true);
    }
 
    public getText(card: Card) {
        return `Cannot be empowered.`;
    }

    public evaluate() {
        return -5;
    }
}


export class CannotBeDiminished extends Mechanic {
    protected validCardTypes = new Set([CardType.Enchantment]);
    
    public run(card: Card, game: Game) {
        (card as Enchantment).setDiminishable(false);
    }

    public remove(card: Card, game: Game) {
        (card as Enchantment).setDiminishable(true);
    }

    public getText(card: Card) {
        return `Cannot be diminished.`;
    }

    public evaluate() {
        return 5;
    }
}

