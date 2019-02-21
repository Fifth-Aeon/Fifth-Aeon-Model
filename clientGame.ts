import { Animator } from './animator';
import { Card, CardPrototype, CardType } from './card-types/card';
import { cardList } from './cards/cardList';
import { Enchantment } from './card-types/enchantment';
import { GameActionRunner, GameActionType } from './events/gameAction';
import {
    GameSyncEvent,
    SyncAttackToggled,
    SyncBlock,
    SyncChoiceMade,
    SyncDamageDistributed,
    SyncDraw,
    SyncEnchantmentModified,
    SyncEnded,
    SyncEventSystem,
    SyncEventType,
    SyncFatigue,
    SyncPhaseChange,
    SyncPlayCard,
    SyncPlayResource,
    SyncQueryResult,
    SyncTurnStart
} from './events/syncEvent';
import { Game, GamePhase } from './game';
import { GameFormat, standardFormat } from './gameFormat';
import { Item } from './card-types/item';
import { Log } from './log';
import { Player } from './player';
import { ServerGame } from './serverGame';
import { Unit } from './card-types/unit';

export class ClientGame extends Game {
    private syncSystem = new SyncEventSystem(this);
    // The player number of the player contorting this game
    private owningPlayer = 0;
    private nextExpectedEvent = 0;
    protected queryData: Card[] | null = null;

    protected onQueryResult: (cards: Card[]) => void = () => null;
    public onSync: () => void = () => null;

    constructor(
        name: string,
        protected runGameAction: GameActionRunner,
        private animator: Animator,
        log?: Log,
        format: GameFormat = standardFormat
    ) {
        super(name, format);
        this.log = log;
        if (this.log) {
            this.log.attachToGame(this);
        }
        this.addSyncHandlers();

        this.players = [
            new Player(
                this,
                [],
                0,
                this.format.initialResource[0],
                this.format.initialLife[0]
            ),
            new Player(
                this,
                [],
                1,
                this.format.initialResource[1],
                this.format.initialLife[1]
            )
        ];

        for (let i = 0; i < this.players.length; i++) {
            this.players[i].disableDraw();
            for (let j = 0; j < this.format.initialDraw[i]; j++) {
                this.players[i].drawCard();
            }
        }
        this.addDeathHandlers();
    }

    public getLog() {
        return this.log;
    }

    // Game Actions ----------------------------------------------------------

    /** Checks if the player controlling this game can play a given card with given targets */
    public canPlayCard(
        card: Card,
        targets: Unit[] = [],
        host: Unit | null = null
    ): boolean {
        if (!this.isPlayerTurn(this.owningPlayer)) {
            return false;
        }
        if (!card.isPlayable(this)) {
            return false;
        }
        card.getTargeter().setTargets(targets);
        if (!card.getTargeter().targetsAreValid(card, this)) {
            return false;
        }
        // Item Host
        if (card.getCardType() === CardType.Item) {
            if (!host) {
                throw new Error('No host supplied for item');
            }
            const item = card as Item;
            item.getHostTargeter().setTargets([host]);
            if (!item.getHostTargeter().targetsAreValid(card, this)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Invoked by the player or A.I to play a card.
     *
     * It will return false if it is not currently legal to play the card.
     * Otherwise it will play the card then send the action to the server.
     *
     * @param card - The card to play
     * @param targets - The card's targets (empty array if it has none)
     * @param host - The card's host if it is an item or null if it is not an item
     *
     */
    public playCardExtern(
        card: Card,
        targets: Unit[] = [],
        host: Unit | null = null
    ): boolean {
        if (!this.canPlayCard(card, targets, host)) {
            console.error('Failed to play card', card);

            return false;
        }
        const targetIds = targets.map(target => target.getId());
        card.getTargeter().setTargets(targets);
        if (card.getCardType() === CardType.Item) {
            if (!host) {
                throw new Error('No host supplied for item');
            }
            (card as Item).getHostTargeter().setTargets([host]);
        }
        this.runGameAction(GameActionType.PlayCard, {
            type: GameActionType.PlayCard,
            player: this.owningPlayer,
            id: card.getId(),
            targetIds: targetIds,
            hostId: host ? host.getId() : undefined
        });
        this.playCard(this.players[card.getOwner()], card);
        return true;
    }

    /**
     * When an attacking unit is blocked by multiple defenders, the attacker's owner may set the order damage is delt in.
     * This function does that for a given attacker and an ordered list of blockers.
     *
     * @param attacker - The unit that has been blocked
     * @param order - The blockers in the order that damage should be applied to them
     */
    public setAttackOrder(attacker: Unit, order: Unit[]) {
        if (!this.attackDamageOrder) {
            return false;
        }
        this.attackDamageOrder.set(attacker.getId(), order);
        this.runGameAction(GameActionType.DistributeDamage, {
            type: GameActionType.DistributeDamage,
            player: this.owningPlayer,
            attackerID: attacker.getId(),
            order: order.map(unit => unit.getId())
        });
        return true;
    }

    public canModifyEnchantment(enchantment: Enchantment): boolean {
        return enchantment.canChangePower(
            this.getPlayer(this.owningPlayer),
            this
        );
    }

    public modifyEnchantment(
        player: Player,
        enchantment: Enchantment
    ): boolean {
        if (!enchantment.canChangePower(player, this)) {
            console.log('illegal attempt to midify enchantment');
            return false;
        }
        enchantment.empowerOrDiminish(player, this);
        this.runGameAction(GameActionType.ModifyEnchantment, {
            type: GameActionType.ModifyEnchantment,
            player: this.owningPlayer,
            enchantmentId: enchantment.getId()
        });
        return true;
    }

    public canAttackWith(unit: Unit): boolean {
        return (
            this.isPlayerTurn(this.owningPlayer) &&
            this.phase === GamePhase.Play1 &&
            unit.canAttack()
        );
    }

    public declareAttacker(unit: Unit): boolean {
        if (!this.canAttackWith(unit)) {
            return false;
        }
        unit.toggleAttacking();
        this.runGameAction(GameActionType.ToggleAttack, {
            type: GameActionType.ToggleAttack,
            player: this.owningPlayer,
            unitId: unit.getId()
        });
        return true;
    }

    public declareBlocker(blocker: Unit, attacker: Unit | null): boolean {
        if (attacker && !blocker.canBlockTarget(attacker)) {
            return false;
        }
        const attackerId = attacker ? attacker.getId() : null;
        blocker.setBlocking(attackerId);
        this.runGameAction(GameActionType.DeclareBlocker, {
            type: GameActionType.DeclareBlocker,
            player: this.owningPlayer,
            blockerId: blocker.getId(),
            blockedId: attackerId
        });
        return true;
    }

    public canMakeChoice(player: number, cards: Card[]): boolean {
        const choices = this.currentChoices[player];
        if (choices === null) {
            console.error(this.name, 'Reject choice from', player);
            return false;
        }
        const min = Math.min(choices.validCards.size, choices.min);
        const max = choices.max;
        if (cards.length > max || cards.length < min) {
            console.error(
                this.name,
                `Reject choice. Wanted between ${min} and ${max} cards but got ${
                    cards.length
                }.`
            );
            return false;
        }
        if (!cards.every(card => choices.validCards.has(card))) {
            console.error(
                `Reject choice. Included invalid options.`,
                cards,
                choices.validCards
            );
            return false;
        }
        return true;
    }

    public makeChoice(player: number, cards: Card[]): boolean {
        if (!this.canMakeChoice(player, cards)) {
            return false;
        }
        this.makeDeferredChoice(player, cards);
        this.runGameAction(GameActionType.CardChoice, {
            type: GameActionType.CardChoice,
            player: this.owningPlayer,
            choice: cards.map(card => card.getId())
        });
        return true;
    }

    public canPlayResource(): boolean {
        return (
            this.isPlayerTurn(this.owningPlayer) &&
            this.players[this.owningPlayer].canPlayResource()
        );
    }

    public playResource(type: string): boolean {
        const res = this.format.basicResources.get(type);
        if (!this.canPlayResource() || !res) {
            return false;
        }
        this.players[this.owningPlayer].playResource(res);
        this.runGameAction(GameActionType.PlayResource, {
            type: GameActionType.PlayResource,
            player: this.owningPlayer,
            resourceType: type
        });
        return true;
    }

    private wouldEndTurn() {
        return (
            (this.isPlayerTurn(this.owningPlayer) &&
                (this.getPhase() === GamePhase.Play1 && !this.isAttacking())) ||
            this.getPhase() === GamePhase.Play2
        );
    }

    public pass(): boolean {
        if (
            this.players[this.owningPlayer].canPlayResource() &&
            this.wouldEndTurn()
        ) {
            return false;
        }
        this.runGameAction(GameActionType.Pass, {
            type: GameActionType.Pass,
            player: this.owningPlayer
        });
        return true;
    }

    public setOwningPlayer(player: number) {
        this.owningPlayer = player;
    }

    public queryCards(
        getCards: (game: ServerGame) => Card[],
        callback: (cards: Card[]) => void
    ) {
        if (this.queryData) {
            callback(this.queryData);
            this.queryData = null;
        } else {
            this.onQueryResult = callback;
        }
    }

    // Animation logic
    private shouldAnimate(): boolean {
        return this.owningPlayer === 0;
    }

    protected async resolveCombat() {
        const attackers = this.getAttackers();
        const blockers = this.getBlockers();
        const defendingPlayer = this.players[
            this.getOtherPlayerNumber(this.getCurrentPlayer().getPlayerNumber())
        ];

        if (this.attackDamageOrder === null) {
            this.generateDamageDistribution();
        }

        this.animator.startAnimation();
        if (!this.attackDamageOrder) {
            throw new Error();
        }

        // Apply blocks in order decided by attacker
        for (const attackerID of Array.from(this.attackDamageOrder.keys())) {
            const attacker = this.getUnitById(attackerID);
            const damageOrder = this.attackDamageOrder.get(attackerID);
            if (!damageOrder) {
                throw new Error();
            }
            let remainingDamage = attacker.getDamage();

            this.animator.triggerBattleAnimation({
                defendingPlayer: defendingPlayer,
                attacker: attacker,
                defenders: damageOrder
            });

            for (const blocker of damageOrder) {
                await this.animator.getAnimationDelay(damageOrder.length * 2);
                const assignedDamage = Math.min(
                    blocker.getLife(),
                    remainingDamage
                );
                remainingDamage -= assignedDamage;
                blocker.getEvents().block.trigger({ attacker });
                blocker.getEvents().attack.trigger({
                    attacker: attacker,
                    damage: assignedDamage,
                    defender: blocker
                });
                attacker.fight(blocker, assignedDamage);

                if (this.shouldAnimate()) {
                    this.animator.triggerDamageIndicatorEvent({
                        amount: assignedDamage,
                        targetCard: blocker.getId()
                    });
                    this.animator.triggerDamageIndicatorEvent({
                        amount: blocker.getDamage(),
                        targetCard: attacker.getId()
                    });
                }

                blocker.setBlocking(null);
                await this.animator.getAnimationDelay(damageOrder.length * 2);
            }
        }

        // Unblocked attackers damage the defending player
        for (const attacker of attackers) {
            if (!this.attackDamageOrder.has(attacker.getId())) {
                if (this.shouldAnimate()) {
                    this.animator.triggerBattleAnimation({
                        defendingPlayer: defendingPlayer,
                        attacker: attacker,
                        defenders: []
                    });
                }
                const dmg = attacker.getDamage();
                await this.animator.getAnimationDelay(2);
                if (this.shouldAnimate()) {
                    this.animator.triggerDamageIndicatorEvent({
                        amount: dmg,
                        targetCard: defendingPlayer.getId()
                    });
                }
                attacker.dealAndApplyDamage(defendingPlayer, dmg);
                attacker.toggleAttacking();
                attacker.setExhausted(true);
                await this.animator.getAnimationDelay(2);
            } else {
                attacker.toggleAttacking();
            }
        }

        this.animator.endAnimation();
        this.attackDamageOrder = null;
        this.changePhase(GamePhase.Play2);
    }

    // Synchronization Logic --------------------------------------------------------

    public isSyncronized() {
        return this.getExpectedCards() === 0;
    }

    /**
     * Syncs an event that happened on the server into the state of this game model
     */
    public syncServerEvent(localPlayerNumber: number, event: GameSyncEvent) {
        if (event.number !== this.nextExpectedEvent) {
            console.error(
                'Event arrived out of order',
                event.number,
                this.events.length
            );
        }
        this.events.push(event);
        try {
            this.syncSystem.handleEvent(localPlayerNumber, event);
        } catch (e) {
            console.error(
                'Error while syncing event',
                SyncEventType[event.type],
                event,
                'for',
                localPlayerNumber
            );
            throw e;
        }

        this.nextExpectedEvent++;
    }

    private idsToCards(ids: Array<string>) {
        return ids.map(id => this.getCardById(id));
    }

    public unpackCard(proto: CardPrototype): Card {
        const existingCard = this.cardPool.get(proto.id);
        if (existingCard) {
            return existingCard;
        }
        const card = cardList.getCard(proto.data);
        card.setId(proto.id);
        card.setOwner(proto.owner);
        this.cardPool.set(proto.id, card);
        return card;
    }

    private addSyncHandlers() {
        this.syncSystem.addHandler(
            SyncEventType.AttackToggled,
            this.syncAttackToggled
        );
        this.syncSystem.addHandler(SyncEventType.TurnStart, this.syncTurnStart);
        this.syncSystem.addHandler(
            SyncEventType.PhaseChange,
            this.syncPhaseChange
        );
        this.syncSystem.addHandler(
            SyncEventType.PlayResource,
            this.syncPlayResource
        );
        this.syncSystem.addHandler(SyncEventType.PlayCard, this.syncCardEvent);
        this.syncSystem.addHandler(SyncEventType.Block, this.syncBlock);
        this.syncSystem.addHandler(SyncEventType.Draw, this.syncDrawEvent);
        this.syncSystem.addHandler(
            SyncEventType.ChoiceMade,
            this.syncChoiceMade
        );
        this.syncSystem.addHandler(
            SyncEventType.QueryResult,
            this.syncQueryResult
        );
        this.syncSystem.addHandler(SyncEventType.Ended, this.syncEnded);
        this.syncSystem.addHandler(
            SyncEventType.EnchantmentModified,
            this.syncModifyEnchantment
        );
        this.syncSystem.addHandler(
            SyncEventType.DamageDistributed,
            this.syncDamageDistribution
        );
    }

    private syncDamageDistribution(
        localPlayerNumber: number,
        event: SyncDamageDistributed
    ) {
        if (localPlayerNumber === this.getCurrentPlayer().getPlayerNumber()) {
            return;
        }
        if (!this.attackDamageOrder) {
            throw new Error();
        }
        const attackerID = event.attackerID as string;
        const order = event.order as string[];
        this.attackDamageOrder.set(
            attackerID,
            order.map(id => this.getUnitById(id))
        );
    }

    private syncCardEvent(localPlayerNumber: number, event: SyncPlayCard) {
        if (event.playerNo !== localPlayerNumber) {
            const player = this.players[event.playerNo];
            const card = this.unpackCard(event.played);
            if (event.targetIds) {
                card.getTargeter().setTargets(
                    event.targetIds.map((id: string) => this.getUnitById(id))
                );
            }
            if (card.getCardType() === CardType.Item) {
                if (!event.hostId) {
                    throw new Error('Play card event for an item lacks hostid');
                }
                (card as Item)
                    .getHostTargeter()
                    .setTargets([this.getUnitById(event.hostId)]);
            }
            this.playCard(player, card);
        }
        if (this.log) {
            this.log.addCardPlayed(event);
        }
    }

    private syncModifyEnchantment(
        localPlayerNumber: number,
        event: SyncEnchantmentModified
    ) {
        if (localPlayerNumber === this.getCurrentPlayer().getPlayerNumber()) {
            return;
        }
        const enchantment = this.getCardById(
            event.enchantmentId
        ) as Enchantment;
        enchantment.empowerOrDiminish(this.getCurrentPlayer(), this);
    }

    public getExpectedCards() {
        return (
            Math.abs(this.players[0].getExpectedDraws()) +
            Math.abs(this.players[1].getExpectedDraws())
        );
    }

    private syncDrawEvent(
        localPlayerNumber: number,
        event: SyncDraw | SyncFatigue
    ) {
        if (event.fatigue === true) {
            this.players[event.playerNo].fatigue();
        } else if (event.discarded) {
            this.addToCrypt(this.unpackCard(event.card));
        } else {
            this.players[event.playerNo].addToHand(this.unpackCard(event.card));
        }

        this.players[event.playerNo].setCardSynced();
        if (this.isSyncronized() && this.onSync) {
            this.onSync();
            this.onSync = () => null;
        }
    }

    private syncTurnStart(localPlayerNumber: number, event: SyncTurnStart) {
        if (this.turnNum === 1) {
            this.mulligan();
            this.turn = event.turn;
            this.turnNum = event.turnNum;
            this.refresh();
        }
    }

    private syncPlayResource(
        localPlayerNumber: number,
        event: SyncPlayResource
    ) {
        if (event.playerNo !== localPlayerNumber) {
            this.players[event.playerNo].playResource(event.resource);
        }
    }

    private syncAttackToggled(
        localPlayerNumber: number,
        event: SyncAttackToggled
    ) {
        if (event.player !== localPlayerNumber) {
            this.getUnitById(event.unitId).toggleAttacking();
        }
    }

    private syncBlock(localPlayerNumber: number, event: SyncBlock) {
        if (event.player !== localPlayerNumber) {
            this.getUnitById(event.blockerId).setBlocking(event.blockedId);
        }
    }

    private syncPhaseChange(localPlayerNumber: number, event: SyncPhaseChange) {
        if (event.phase === GamePhase.Block) {
            this.gameEvents.playerAttacked.trigger({
                target: this.getOtherPlayerNumber(this.getActivePlayer())
            });
        }
        if (event.phase === GamePhase.Play2) {
            this.resolveCombat();
        }
        if (event.phase === GamePhase.DamageDistribution) {
            this.generateDamageDistribution();
        }

        if (event.phase === GamePhase.End) {
            this.startEndPhase();
        } else {
            this.changePhase(event.phase);
        }
    }

    private syncChoiceMade(localPlayerNumber: number, event: SyncChoiceMade) {
        if (event.player !== localPlayerNumber) {
            this.makeDeferredChoice(
                event.player,
                this.idsToCards(event.choice)
            );
        }
    }

    private setQueryResult(cards: Card[]) {
        if (this.onQueryResult) {
            this.onQueryResult(cards);
        } else {
            this.queryData = cards;
        }
    }

    private syncQueryResult(localPlayerNumber: number, event: SyncQueryResult) {
        const cards = event.cards.map(proto => this.unpackCard(proto));
        this.setQueryResult(cards);
    }

    private syncEnded(localPlayerNumber: number, event: SyncEnded) {
        this.winner = event.winner;
    }
}
