import { Player } from './player';
import { Unit } from './unit';

export class Animator {
    private battleAnimationSubscribers = new Array<
        (ev: BattleAnimationEvent) => void
    >();
    private damageIndicatorSubscribers = new Array<
        (ev: DamageIndicatorEvent) => void
    >();
    private nextAnimationTime = 0;
    private animating = false;
    private onAnimationEnd: () => any = () => null;

    constructor(private multiplier = 1) {}

    private getAnimationTime() {
        return this.nextAnimationTime * this.multiplier;
    }

    public startAnimation() {
        this.animating = true;
    }

    public endAnimation() {
        this.animating = false;
        this.onAnimationEnd();
    }

    public async awaitAnimationEnd() {
        return new Promise(resolve => {
            if (this.animating) {
                this.onAnimationEnd = () => {
                    resolve();
                };
            } else {
                resolve();
            }
        });
    }

    public isAnimating() {
        return this.animating;
    }

    public getAnimationDelay(slices = 1) {
        return new Promise<boolean>(resolve => {
            setTimeout(() => resolve(true), this.getAnimationTime() / slices);
        });
    }

    public addBattleAnimationHandler(
        handler: (event: BattleAnimationEvent) => void
    ) {
        this.battleAnimationSubscribers.push(handler);
    }

    public triggerBattleAnimation(battleData: BattleAnimationEvent) {
        this.nextAnimationTime = 2000 + battleData.defenders.length * 750;
        for (const handler of this.battleAnimationSubscribers) {
            handler(battleData);
        }
    }

    public addDamageIndicatorEventHandler(
        handler: (event: DamageIndicatorEvent) => void
    ) {
        this.damageIndicatorSubscribers.push(handler);
    }

    public triggerDamageIndicatorEvent(damageData: DamageIndicatorEvent) {
        for (const handler of this.damageIndicatorSubscribers) {
            handler(damageData);
        }
    }
}

export interface BattleAnimationEvent {
    defendingPlayer: Player;
    attacker: Unit;
    defenders: Array<Unit>;
}

export interface DamageIndicatorEvent {
    targetCard: string;
    amount: number;
}
