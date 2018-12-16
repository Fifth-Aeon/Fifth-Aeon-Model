
import { Game } from './game';
import { Card } from '../game_model/card';
import { Unit } from '../game_model/unit';
import { properList } from '../game_model/strings';
import { GameSyncEvent, SyncPlayCard } from './events/syncEvent';

export class Log {
    private items: LogItem[] = [];
    private game: Game;

    constructor(private playerNo: number = 0, private size: number = 20) { }

    public addCombatResolved(attackers: Unit[], blockers: Unit[], defender: number) {
        let attackersList = properList(attackers.map(unit => unit.getName()));
        let blockerList = properList(blockers.map(blocker => {
            let blocked = this.game.getUnitById(blocker.getBlockedUnitId());
            return `${blocked.getName()} with ${blocker.getName()}`;
        }));
        let attackerName = this.isEnemy(defender) ? 'You' : 'Your opponent';
        let blockerName = this.isEnemy(defender)  ? 'Your opponent' : 'You';
        let tip = `${attackerName} attacked with ${attackersList}. `;
        if (blockers.length > 0) {
            tip += `${blockerName} blocked ${blockerList}.`;
        }

        this.addItem({
            image: 'assets/png/crossed-sabres.png',
            desc: tip,
            color: !this.isEnemy(defender) ? 'crimson' : 'cornflowerblue',
        });
    }

    public addCardPlayed(event: SyncPlayCard) {
        this.addItem({
            image: this.getCardImage(this.getCard(event)),
            desc: this.makeCardPlayTooltip(event),
            color: this.isEnemy(event.playerNo) ? 'crimson' : 'cornflowerblue'
        });
    }

    private addItem(item: LogItem) {
        if (this.items.length >= this.size)
            this.items.pop();
        this.items.unshift(item);
    }

    public clear() {
        this.items = [];
    }

    public setPlayer(playerNo: number) {
        this.playerNo = playerNo;
    }

    public getItems() {
        return this.items;
    }

    public attachToGame(game: Game) {
        this.game = game;
    }

    public getCard(event: SyncPlayCard): Card {
        return this.game.getCardById(event.played.id);
    }

    public isEnemy(player: number) {
        return player !== this.playerNo;
    }

    private makeCardPlayTooltip(event: SyncPlayCard): string {
        let name = this.isEnemy(event.playerNo) ? 'Your opponent' : 'You';
        let card = this.getCard(event);
        let targetString = '';
        if (!card)
            return '';
        if (event.targetIds !== null && event.targetIds.length > 0) {
            let targets: Card[] = event.targetIds.map((id: string) => this.game.getCardById(id));
            targetString = ' targeting ' + targets.map(target => target ? target.getName() : 'unknown').join(' and ');
        }
        let effectString = card.isUnit() ? '' : ` It has the effect "${card.getText(this.game)}"`;
        return `${name} played ${card.getName()}${targetString}.` + effectString;
    }

    private getCardImage(card: Card) {
        if (!card)
            return '';
        return 'assets/png/' + card.getImage();
    }

}

export interface LogItem {
    image: string;
    desc: string;
    color: string;
}
