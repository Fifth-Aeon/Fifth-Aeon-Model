import { Unit } from '../card-types/unit';
import { Lethal, Shielded } from '../cards/mechanics/skills';
import { TransformDamaged } from '../cards/mechanics/decaySpecials';

/** Represents the outcome of a 1v1 fight based on which of the two units die */
export enum BlockOutcome {
    AttackerDies,
    NeitherDies,
    BothDie,
    BlockerDies
}

export class CombatAnalyzer {
    /** Categorizes a block by what its outcome will be (if the attacker, blocker or both will die) */
    public static categorizeBlock(attacker: Unit, blocker: Unit): BlockOutcome {
        const isAttackerLethal =
            attacker.hasMechanicWithId(Lethal.getId()) ||
            attacker.hasMechanicWithId(TransformDamaged.getId());
        const isBlockerLethal =
            blocker.hasMechanicWithId(Lethal.getId()) ||
            blocker.hasMechanicWithId(TransformDamaged.getId());

        let shield = attacker.hasMechanicWithId(Shielded.getId()) as Shielded;
        const isAttackerShielded = shield && !shield.isDepleted();
        shield = blocker.hasMechanicWithId(Shielded.getId()) as Shielded;
        const isBlockerShielded = shield && !shield.isDepleted();

        const attackerDies =
            !isAttackerShielded &&
            (isBlockerLethal || blocker.getDamage() >= attacker.getLife());
        const blockerDies =
            !isBlockerShielded &&
            (isAttackerLethal || attacker.getDamage() >= blocker.getLife());

        if (attackerDies && blockerDies) {
            return BlockOutcome.BothDie;
        } else if (attackerDies) {
            return BlockOutcome.AttackerDies;
        } else if (blockerDies) {
            return BlockOutcome.BlockerDies;
        } else {
            return BlockOutcome.NeitherDies;
        }
    }

    public static evaluateAllBlocks(
        blockers: Unit[],
        attackers: Unit[],
        evaluator: (blocks: [Unit, Unit?][]) => number
    ) {
        const attackersBlockerCanBlock = blockers
            .map(
                blocker =>
                    [
                        blocker,
                        attackers.filter(attacker =>
                            blocker.canBlockTarget(attacker)
                        )
                    ] as [Unit, Unit[]]
            )
            .filter(blockCombo => blockCombo[1].length > 0);

        const lastBlocker = attackersBlockerCanBlock.length - 1;
        const highestBlocks = attackersBlockerCanBlock.map(
            combo => combo[1].length
        );
        const notBlocking = -1;
        const blockCombination = attackersBlockerCanBlock.map(_ => notBlocking);

        let bestScore = -Infinity;
        let bestCombo;
        while (blockCombination[lastBlocker] < highestBlocks[lastBlocker]) {
            const combo: [Unit, Unit?][] = this.makeCombo(
                blockCombination,
                attackersBlockerCanBlock
            );
            const score = evaluator(combo);
            if (score > bestScore) {
                bestScore = score;
                bestCombo = combo;
            }

            /// Compute the next combo
            let currentDigit = 0;
            while (true) {
                blockCombination[currentDigit]++;
                if (
                    blockCombination[currentDigit] !==
                    highestBlocks[currentDigit]
                ) {
                    break;
                }
                blockCombination[currentDigit] = notBlocking;
                currentDigit++;
            }
        }

        return bestCombo;
    }

    public static  makeCombo(
        blockCombination: number[],
        attackersBlockerCanBlock: [Unit, Unit[]][]
    ): [Unit, Unit?][] {
        return blockCombination.map((comboNumber, i) => [
            attackersBlockerCanBlock[i][0],
            comboNumber === -1 ? undefined : attackersBlockerCanBlock[i][1][comboNumber]
        ]);
    }
}
