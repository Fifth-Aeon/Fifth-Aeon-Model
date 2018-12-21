import { Card } from '../../card';
import { Game } from '../../game';
import { TriggeredMechanic } from '../../mechanic';
import { ParameterType } from '../parameters';

export class WinIfHighLife extends TriggeredMechanic {
    protected static id = 'WinIfHighLife';
    protected static ParameterTypes = [
        { name: 'Threshold', type: ParameterType.NaturalNumber }
    ];

    constructor(private threshold: number = 1) {
        super();
    }

    public onTrigger(card: Card, game: Game) {
        const friendlyPlayer = game.getPlayer(card.getOwner());
        const enemyPlayer = game.getPlayer(
            game.getOtherPlayerNumber(card.getOwner())
        );

        if (friendlyPlayer.getLife() >= this.threshold) {
            enemyPlayer.die();
        }
    }

    public getText(card: Card) {
        return `If you have ${this.threshold} or more life you win the game.`;
    }

    public evaluateEffect(card: Card, game: Game) {
        const friendlyPlayer = game.getPlayer(card.getOwner());
        if (friendlyPlayer.getLife() >= this.threshold) {
            return Infinity;
        }
        return 0;
    }
}
