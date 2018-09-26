import { Card } from './card';
import { Unit } from './unit';
import { Player } from './player';

export class Animator {
    private battleAnimationSubscribers = new Array<(ev: BattleAnimationEvent) => void>();
    private nextAnimationTime: number;
    private animating = false;

    constructor(
        private multiplier = 1
    ) { }

    private getAnimationTime() {
        return this.nextAnimationTime * this.multiplier;
    }

    public startAnimation() {
        this.animating = true;
    }

    public endAnimation() {
        this.animating = false;
    }

    public isAnimating() {
        return this.animating;
    }

    public getAnimationDelay(slices = 1) {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(true), this.getAnimationTime() / slices);
        });
    }

    public addBattleAnimationHandler(handler: (event: BattleAnimationEvent) => void) {
        this.battleAnimationSubscribers.push(handler);
    }

    public triggerBattleAnimation(battleData: BattleAnimationEvent) {
        this.nextAnimationTime = 2000 + battleData.defenders.length * 750;
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

