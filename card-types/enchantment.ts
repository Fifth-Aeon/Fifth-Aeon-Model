import { CardType, GameZone, Card } from './card';
import { Game } from '../game';
import { EvalContext, Mechanic, EvalMap } from '../mechanic';
import { Permanent } from './permanent';
import { Player } from '../player';
import { Resource } from '../resource';
import { Targeter } from '../targeter';

export class Enchantment extends Permanent {
    private power: number;
    private costResource: Resource;
    private canBeEmpowered = true;
    private canBeDiminished = true;

    constructor(
        dataId: string,
        name: string,
        imageUrl: string,
        cost: Resource,
        targeter: Targeter,
        private changeCost: number,
        private basePower: number,
        mechanics: Mechanic[]
    ) {
        super(dataId, name, imageUrl, cost, targeter, mechanics);
        this.power = this.basePower;
        this.costResource = new Resource(this.changeCost);
    }

    public getModifyCost() {
        return this.costResource;
    }

    public canChangePower(player: Player, game: Game) {
        return (
            game.getCurrentPlayer() === player &&
            player.getPool().meetsReq(this.costResource) &&
            (player.getPlayerNumber() === this.owner
                ? this.canBeEmpowered
                : this.canBeDiminished)
        );
    }

    public setEmpowerable(val: boolean) {
        this.canBeEmpowered = val;
    }

    public setDiminishable(val: boolean) {
        this.canBeDiminished = val;
    }

    public getPower() {
        return this.power;
    }

    public empowerOrDiminish(player: Player, game: Game) {
        player.reduceResource(new Resource(this.changeCost));
        this.changePower(player.getPlayerNumber() === this.owner ? 1 : -1);
    }

    public changePower(diff: number) {
        const prevPower = this.power;
        this.power += diff;
        if (this.power <= 0) {
            this.die();
        }
        return prevPower - Math.max(this.power, 0);
    }

    public die() {
        if (this.location !== GameZone.Board) {
            return;
        }
        this.events.death.trigger({});
        this.location = GameZone.Crypt;
    }

    public evaluate(game: Game, context: EvalContext, evaluated: EvalMap) {
        return super.evaluate(game, EvalContext.Play, evaluated);
    }

    public isPlayable(game: Game): boolean {
        return (
            super.isPlayable(game) &&
            game.getBoard().canPlayPermanent(this.getOwner())
        );
    }

    public getCardType() {
        return CardType.Enchantment;
    }

    public play(game: Game) {
        super.play(game);
        this.power = this.basePower;
        this.location = GameZone.Board;

        game.playPermanent(this);
    }
}

export const isEnchantment = (item: Card): item is Enchantment => item.getCardType() === CardType.Enchantment;
