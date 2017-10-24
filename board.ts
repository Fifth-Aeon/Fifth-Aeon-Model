import { Permanent } from './permanent';
import { CardType } from './card';
import { Unit } from './unit';
import { Enchantment } from './enchantment';

/**
 * A simple board where each side can place up to a fixed number of units without any positoning.
 * 
 * @export
 * @class Board
 */
export class Board {
    private spaces: Permanent[][];

    constructor(playerCount: number, private spaceCount: number) {
        this.spaces = new Array(playerCount);
        for (let i = 0; i < this.spaces.length; i++) {
            this.spaces[i] = [];
        }
    }

    public canPlayPermanant(playerOrPerm: number | Permanent) {
        if (typeof playerOrPerm != 'object') {
            return this.spaces[playerOrPerm].length < this.spaceCount;
        } else {
            return this.spaces[playerOrPerm.getOwner()].length < this.spaceCount;
        }
    }

    public addPermanent(permanent: Permanent) {
        this.spaces[permanent.getOwner()].push(permanent);
    }

    public getAllUnits(): Array<Unit> {
        let res: Unit[] = [];
        for (let i = 0; i < this.spaces.length; i++) {
            for (let j = 0; j < this.spaces[i].length; j++) {
                if (this.spaces[i][j].isUnit())
                    res.push(this.spaces[i][j] as Unit);
            }
        }
        return res;
    }

    public getAllEnchantments(): Array<Enchantment> {
        let res: Enchantment[] = [];
        for (let i = 0; i < this.spaces.length; i++) {
            for (let j = 0; j < this.spaces[i].length; j++) {
                if (this.spaces[i][j].getCardType() == CardType.Enchantment)
                    res.push(this.spaces[i][j] as Enchantment);
            }
        }
        return res;
    }

    public getPlayerUnits(playerNumber: number): Unit[] {
        return this.spaces[playerNumber].filter(perm => perm.isUnit()) as Unit[];
    }

    public getPlayerPermanants(playerNumber:number) {
        return this.spaces[playerNumber];
    }

    public removePermanant(perm: Permanent) {
        for (let i = 0; i < this.spaces.length; i++) {
            for (let j = 0; j < this.spaces[i].length; j++) {
                if (this.spaces[i][j] === perm)
                    this.spaces[i].splice(j, 1);
            }
        }
    }
}
