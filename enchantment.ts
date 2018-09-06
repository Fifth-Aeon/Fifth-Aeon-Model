import { Card, CardType, GameZone } from './card';
import { Permanent } from './permanent';
import { Player } from './player';
import { Unit } from './unit';
import { Mechanic } from './mechanic';
import { Resource } from './resource';
import { Targeter } from './targeter';

import { Game } from './game';
import { EvalContext } from './mechanic';

export class Enchantment extends Permanent {
    private power: number;
    private costResource: Resource;
    private canBeEmpowered = true;
    private canBeDiminished = true;

    constructor(dataId: string, name: string, imageUrl: string, cost: Resource, targeter: Targeter,
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
        return game.getCurrentPlayer() === player &&
            player.getPool().meetsReq(this.costResource) &&
            (player.getPlayerNumber() === this.owner ?
                this.canBeEmpowered : this.canBeDiminished);
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
        this.power += diff;
        if (this.power <= 0) {
            this.die();
        }
    }

    public die() {
        if (this.location !== GameZone.Board)
            return;
        this.events.death.trigger({});
        this.location = GameZone.Crypt;
    }

    public evaluate(game: Game) {
        return super.evaluate(game, EvalContext.Play);
    }

    public isPlayable(game: Game): boolean {
        return super.isPlayable(game) &&
            game.getBoard().canPlayPermanant(this.getOwner());
    }

    public getCardType() {
        return CardType.Enchantment;
    }

    public async play(game: Game) {
        super.play(game);
        this.power = this.basePower;
        this.location = GameZone.Board;

        game.playPermanent(this, this.owner);
    }
}
