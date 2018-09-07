import { Player } from './player';
import { Unit } from './unit';
import { Card } from './card';

export class Animator {
    private battleAnimationSubscribers = new Array<(ev: BattleAnimationEvent) => Promise<any>>();
    private targetAnimationSubscribers = new Array<(ev: TargetedAnimationEvent) => Promise<any>>();
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

    public makeDelay(timeInMs: number) {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(true), timeInMs);
        });
    }

    public getAnimationDelay(slices = 1) {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(true), this.getAnimationTime() / slices);
        });
    }

    public addBattleAnimiatonHandler(handler: (event: BattleAnimationEvent) => Promise<any>) {
        this.battleAnimationSubscribers.push(handler);
    }

    public addTrargetedAnimiatonHandler(handler: (event: TargetedAnimationEvent) => Promise<any>) {
        this.targetAnimationSubscribers.push(handler);
    }

    public triggerBattleAnimation(battleData: BattleAnimationEvent) {
        this.nextAnimiationTime = 2000 + battleData.defenders.length * 750;
        for (let handler of this.battleAnimationSubscribers) {
            handler(battleData);
        }
    }

    public async triggerTrargetedAnimation(data: TargetedAnimationEvent) {
        for (let handler of this.targetAnimationSubscribers) {
            await handler(data);
        }
    }
}


export interface TargetedAnimationEvent {
    source: Card;
    sink: Card;
}

export interface BattleAnimationEvent {
    defendingPlayer: Player;
    attacker: Unit;
    defenders: Array<Unit>;
}

