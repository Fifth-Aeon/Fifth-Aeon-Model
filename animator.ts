import { Card } from './card';
import { Unit } from './unit';
import { Player } from './player';

export class Animator {
    private battleAnimationSubscribers = new Array<(ev: BattleAnimationEvent) => void>();
    private nextAnimiationTime: number;
    private animating = false;

    constructor(
        private multiplier = 1
    ) { }

    private getAnimationTime() {
        return this.nextAnimiationTime * this.multiplier;
    }

    public startAnimiation() {
        this.animating = true;
    }

    public endAnimiation() {
        this.animating = false;
    }

    public isAnimiating() {
        return this.animating;
    }

    public getAnimationDelay(slices = 1) {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(true), this.getAnimationTime() / slices);
        });
    }

    public addBattleAnimiatonHandler(handler: (event: BattleAnimationEvent) => void) {
        this.battleAnimationSubscribers.push(handler);
    }

    public triggerBattleAnimation(battleData: BattleAnimationEvent) {
        this.nextAnimiationTime = 2000 + battleData.defenders.length * 750;
        for (let handler of this.battleAnimationSubscribers) {
            handler(battleData);
        }
    }
}

export interface BattleAnimationEvent {
    defendingPlayer: Player;
    attacker: Unit;
    defenders: Array<Unit>;
}

