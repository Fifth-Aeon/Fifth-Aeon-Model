import { CardType } from './card';
import { Enchantment } from './enchantment';
import { Permanent } from './permanent';
import { Unit } from './unit';

/**
 * A simple board where each side can place up to a fixed number of units without any positioning.
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

    public getRemainingSpace(player: number) {
        return this.spaceCount - this.spaces[player].length;
    }

    public canPlayPermanent(playerOrPerm: number | Permanent) {
        if (typeof playerOrPerm !== 'object') {
            return this.spaces[playerOrPerm].length < this.spaceCount;
        } else {
            return (
                this.spaces[playerOrPerm.getOwner()].length < this.spaceCount
            );
        }
    }

    public addPermanent(permanent: Permanent) {
        this.spaces[permanent.getOwner()].push(permanent);
        if (this.spaces[permanent.getOwner()].length > this.spaceCount) {
            permanent.die();
        }
    }

    public getAllUnits(): Array<Unit> {
        const res: Unit[] = [];
        for (let i = 0; i < this.spaces.length; i++) {
            for (let j = 0; j < this.spaces[i].length; j++) {
                if (this.spaces[i][j].isUnit()) {
                    res.push(this.spaces[i][j] as Unit);
                }
            }
        }
        return res;
    }

    public getAllEnchantments(): Array<Enchantment> {
        const res: Enchantment[] = [];
        for (let i = 0; i < this.spaces.length; i++) {
            for (let j = 0; j < this.spaces[i].length; j++) {
                if (this.spaces[i][j].getCardType() === CardType.Enchantment) {
                    res.push(this.spaces[i][j] as Enchantment);
                }
            }
        }
        return res;
    }

    public getAllEnemyEnchantments(playerNumber: number): Array<Enchantment> {
        const res: Enchantment[] = [];
        const enemyPlayer = this.spaces[playerNumber];

        for (let j = 0; j < this.spaces[playerNumber].length; j++) {
            if (
                this.spaces[playerNumber][j].getCardType() ===
                CardType.Enchantment
            ) {
                res.push(this.spaces[playerNumber][j] as Enchantment);
            }
        }

        return res;
    }

    public getPlayerUnits(playerNumber: number): Unit[] {
        return this.spaces[playerNumber].filter(perm =>
            perm.isUnit()
        ) as Unit[];
    }

    public getPlayerPermanents(playerNumber: number) {
        return this.spaces[playerNumber];
    }

    public removePermanent(perm: Permanent) {
        for (let i = 0; i < this.spaces.length; i++) {
            for (let j = 0; j < this.spaces[i].length; j++) {
                if (this.spaces[i][j] === perm) {
                    this.spaces[i].splice(j, 1);
                }
            }
        }
    }
}
