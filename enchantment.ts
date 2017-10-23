import { Card, CardType, Location } from './card';
import { Permanent } from './permanent';
import { Player } from './player';
import { Unit } from './unit';
import { Mechanic } from './mechanic';
import { Resource } from './resource';
import { Targeter } from './targeter';
import { EventGroup, EventType, GameEvent } from './gameEvent';
import { Game } from './game';

export class Enchantment extends Permanent {
    private power: number;
    private costResource: Resource;

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
        return (game.getCurrentPlayer() == player && player.getPool().meetsReq(this.costResource));
    }

    public empowerOrDiminish(player: Player, game: Game) {
        player.reduceResource(new Resource(this.changeCost));
        this.changePower(player.getPlayerNumber() == this.owner ? 1 : -1);
    }

    private changePower(diff: number) {
        this.power += diff;
        if (this.power <= 0) {
            this.die();
        }
    }

    public die() {
        if (this.location != Location.Board)
            return;
        this.events.trigger(EventType.Death, new Map());
        this.location = Location.Crypt;
    }

    public evaluate(game: Game) {
        return super.evaluate(game);
    }

    public isPlayable(game: Game): boolean {
        return super.isPlayable(game) &&
            game.getBoard().canPlayPermanant(this.getOwner());
    }

    public getCardType() {
        return CardType.Enchantment;
    }

    public play(game: Game) {
        super.play(game);
        this.power = this.basePower;
        this.location = Location.Board;
        game.gameEvents.addEvent(null, new GameEvent(EventType.StartOfTurn, (params) => {
            let player = params.get('player') as number;
            if (player == this.getOwner())
                this.changePower(-1);
            return params;
        }));
        game.playPermanent(this, this.owner);
    }
}