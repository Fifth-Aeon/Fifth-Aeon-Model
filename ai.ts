import { GameActionType, GamePhase, GameAction, GameSyncEvent, SyncEventType } from './game';
import { ClientGame } from './clientGame';
import { Resource, ResourceTypeNames } from './resource';
import { Player } from './player';
import { Card, CardType } from './card';
import { Unit } from './unit';
import { Item } from './item';

import { minBy, sample, sampleSize, maxBy, sortBy, sumBy, remove } from 'lodash';
import { LinkedList } from 'typescript-collections';

export enum AiDifficulty {
    Easy, Medium, Hard
}

/*
AI Plan

On my turn
1. Play resource
2. Analyze playable cards
3. Play cards useful for combat (eg, remove blockers)
4. Maybe attack
5. Play cards not useful for combat (eg, non fast units)

During my opponents turn
1. Analyze block
*/

export abstract class AI {
    constructor(
        protected playerNumber: number,
        protected game: ClientGame) { }

    abstract handleGameEvent(event: GameSyncEvent): void;
    abstract pulse(): void;
}

export class BasicAI extends AI {
    private eventHandlers: Map<SyncEventType, (params: any) => void> = new Map();
    private enemyNumber: number;
    private aiPlayer: Player;
    private actionSequence: LinkedList<() => void> = new LinkedList<() => void>();

    constructor(playerNumber: number, game: ClientGame) {
        super(playerNumber, game);
        this.aiPlayer = this.game.getPlayer(this.playerNumber);
        this.enemyNumber = this.game.getOtherPlayerNumber(this.playerNumber);

        this.game.promptCardChoice = this.makeChoice.bind(this);
        this.eventHandlers.set(SyncEventType.TurnStart, event => this.onTurnStart(event.params));
        this.eventHandlers.set(SyncEventType.PhaseChange, event => this.onPhaseChange(event.params));
        this.eventHandlers.set(SyncEventType.ChoiceMade, event => this.continue());
    }

    public pulse() {
        this.continue();
    }

    private addActionToSequence(action: () => void, front: boolean = false) {
        this.actionSequence.add(action.bind(this), front ? 0 : this.actionSequence.size());
    }

    private sequenceActions(actions: Array<() => void>) {
        this.actionSequence = new LinkedList<() => void>();
        for (let action of actions) {
            this.addActionToSequence(action);
        }
    }

    private dequeue(): () => void {
        let val = this.actionSequence.first();
        this.actionSequence.remove(val);
        return val;
    }

    private continue() {
        if (!this.game.canTakeAction() || !this.game.isActivePlayer(this.playerNumber))
            return;
        let next = this.dequeue() || this.game.pass.bind(this.game);
        next();
    }

    private pass() {
        this.game.pass();
    }

    private getBestTarget(card: Card) {
        let targets = card.getTargeter().getValidTargets(card, this.game);
        return maxBy(targets, target => card.evaluateTarget(target, this.game));
    }

    private evaluateCard(card: Card) {
        let score = 0;
        if (card.getTargeter().needsInput()) {
            let best = this.getBestTarget(card);
            score += card.evaluateTarget(best, this.game);
        }
        return score + card.evaluate(this.game);
    }

    private makeChoice(player: number, cards: Array<Card>, toPick: number = 1, callback: (cards: Card[]) => void = null) {
        this.game.setDeferedChoice(this.playerNumber, callback);
        if (player != this.playerNumber) {
            console.log('A.I skip choice', player, this.playerNumber);
            return;
        }
        let choice = sampleSize(cards, toPick);
        console.log('A.I make choice', choice)
        if (callback) {
            this.game.makeChoice(choice);
        }
    }

    public handleGameEvent(event: GameSyncEvent) {
        this.game.syncServerEvent(this.playerNumber, event);
        //console.log('A.I event -', SyncEventType[event.type], event.params, this.eventHandlers.get(event.type));
        if (this.eventHandlers.has(event.type))
            this.eventHandlers.get(event.type)(event);
    }

    private onTurnStart(params: any) {
        if (this.playerNumber !== params.turn)
            return;
        this.playResource();
        this.sequenceActions([this.selectCardToPlay, this.attack, this.pass, this.modifyEnchantments]);
    }

    private selectCardToPlay() {
        let playable = this.aiPlayer.getHand().filter(card => card.isPlayable(this.game));
        console.log('hand', this.aiPlayer.getHand());
        if (playable.length > 0) {
            let evaluated = sortBy(playable, card => -this.evaluateCard(card));
            console.log('eval', evaluated.map(card => card.getName() + ' ' + this.evaluateCard(card)).join(' | '));
            let toPlay = evaluated[0];
            console.log('play', toPlay.getName());

            if (this.evaluateCard(toPlay) <= 0)
                return;
            let targets = []
            let host = null;
            if (toPlay.getCardType() == CardType.Item)
                host = this.getBestHost(toPlay as Item);
            if (toPlay.getTargeter().needsInput() && this.getBestTarget(toPlay))
                targets.push(this.getBestTarget(toPlay));
            this.game.playCardExtern(toPlay, targets, host);
            this.addActionToSequence(this.selectCardToPlay, true);
        }
    }

    private modifyEnchantments() {
        let player = this.game.getPlayer(this.playerNumber);
        let res = player.getPool();
        let enchantments = this.game.getBoard()
            .getAllEnchantments()
            .filter(enchant => res.meetsReq(enchant.getModifyCost()));

        if (enchantments.length == 0)
            return;
        let lowest = minBy(enchantments, (enchant) => enchant.getModifyCost().getNumeric());
        this.game.modifyEnchantment(player, lowest);
        this.addActionToSequence(this.modifyEnchantments, true);

    }

    private getBestHost(item: Item): Unit {
        return sample(this.game.getBoard().getPlayerUnits(this.playerNumber));
    }

    private playResource() {
        let hand = this.aiPlayer.getHand();
        let total = new Resource(0);
        for (let card of hand) {
            total.add(card.getCost());
        }
        let toPlay = maxBy(ResourceTypeNames, type => total.getOfType(type));
        this.game.playResource(toPlay);
    }

    // Attacking/Blocking -------------------------------------------------------------------------
    private attack() {
        let potentialAttackers = this.game.getBoard().getPlayerUnits(this.playerNumber)
            .filter(unit => unit.canAttack())
            .filter(unit => unit.getDamage() > 0);
        let potentialBlockers = this.game.getBoard().getPlayerUnits(this.enemyNumber)
            .filter(unit => !unit.isExausted());
        let attacked = false;
        for (let attacker of potentialAttackers) {
            let hasBlocker = false;
            for (let blocker of potentialBlockers) {
                if (this.canFavorablyBlock(attacker, blocker)) {
                    hasBlocker = true;
                    break;
                }
            }
            if (!hasBlocker) {
                this.game.declareAttacker(attacker);
                attacked = true;
            }
        }
    }

    private canFavorablyBlock(attacker: Unit, blocker: Unit) {
        if (!blocker.canBlockTarget(attacker, true))
            return false;
        let type = this.categorizeBlock(attacker, blocker);
        return type == BlockType.AttackerDies ||
            type == BlockType.NeitherDies ||
            (type == BlockType.BothDie &&
                attacker.evaluate(this.game) > blocker.evaluate(this.game))
    }

    private categorizeBlock(attacker: Unit, blocker: Unit): BlockType {
        let isAttackerLethal = attacker.hasMechanicWithId('lethal') || attacker.hasMechanicWithId('transfomTarget');
        let isBlockerLethal = blocker.hasMechanicWithId('lethal') || blocker.hasMechanicWithId('transfomTarget');
        let attackerDies = isBlockerLethal || blocker.getDamage() >= attacker.getLife();
        let blockerDies = isAttackerLethal || attacker.getDamage() >= blocker.getLife();

        if (attackerDies && blockerDies) {
            return BlockType.BothDie;
        } else if (attackerDies) {
            return BlockType.AttackerDies;
        } else if (blockerDies) {
            return BlockType.BlockerDies;
        } else {
            return BlockType.NeitherDies;
        }
    }

    private makeBlockAction(params: { blocker: Unit, attacker: Unit }) {
        return () => {
            this.game.declareBlocker(params.blocker, params.attacker);
        }
    }

    private block() {
        let attackers = sortBy(this.game.getAttackers(), (attacker) =>
            -(attacker.getDamage() + (attacker.hasMechanicWithId('flying') != undefined ? 1000 : 0)));
        let potentialBlockers = this.game.getBoard().getPlayerUnits(this.playerNumber)
            .filter(unit => !unit.isExausted());
        let totalDamage = sumBy(attackers, (attacker) => attacker.getDamage());
        let life = this.aiPlayer.getLife()
        let blocks = [];
        for (let attacker of attackers) {
            let options = [] as { blocker: Unit, attacker: Unit, type: BlockType, tradeScore: number }[];
            for (let blocker of potentialBlockers) {
                if (blocker.canBlockTarget(attacker)) {
                    options.push({
                        blocker: blocker,
                        attacker: attacker,
                        type: this.categorizeBlock(attacker, blocker),
                        tradeScore: blocker.evaluate(this.game) - attacker.evaluate(this.game)
                    });
                }
            }
            let best = minBy(options, option => option.type * 100000 + option.tradeScore)
            console.log('options', options, 'best', best);
            if (best != undefined && (
                totalDamage >= life ||
                best.type < BlockType.BothDie ||
                best.type == BlockType.BothDie && best.tradeScore <= 0)) {
                blocks.push(best);
                totalDamage -= best.attacker.getDamage();
                remove(potentialBlockers, (unit) => unit == best.blocker);
            }
        }
        let actions = blocks.map(block => {
            return this.makeBlockAction(block)
        });
        this.sequenceActions(actions);
    }

    private onPhaseChange(params: any) {
        if (params.phase === GamePhase.Block && this.game.isActivePlayer(this.playerNumber))
            this.block()
        if (params.phase === GamePhase.Play2 && this.game.isActivePlayer(this.playerNumber)) {
            this.game.pass();
        }
    }
}

enum BlockType {
    AttackerDies, NeitherDies, BothDie, BlockerDies
}