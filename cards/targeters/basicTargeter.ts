import { Game } from '../../game';
import { Card } from '../../card';
import { Unit } from '../../unit';

import { every } from 'lodash';
import { Targeter } from '../../targeter';

export class OwningPlayer extends Targeter {
    protected static id = 'OwningPlayer';

    public needsInput() {
        return false;
    }

    public getTargets(card: Card, game: Game) {
        return [game.getPlayer(card.getOwner())];
    }

    public getText() {
        return 'this card’s owner';
    }
}

export class EnemyPlayer extends Targeter {
    protected static id = 'EnemyPlayer';
    public needsInput() {
        return false;
    }

    public getTargets(card: Card, game: Game) {
        return [game.getPlayer(game.getOtherPlayerNumber(card.getOwner()))];
    }

    public getText() {
        return 'this unit’s owner’s opponent';
    }
}

export class Untargeted extends Targeter {
    protected static id = 'Untargeted';
    public getText() {
        return '';
    }
    public needsInput() {
        return false;
    }
}

export class SelfTarget extends Targeter {
    protected static id = 'SelfTarget';
    public getTargets(card: Card, game: Game): Array<Unit> {
        return [card as Unit];
    }

    public getText() {
        return 'this unit';
    }
    public needsInput() {
        return false;
    }

}

export class SingleUnit extends Targeter {
    protected static id = 'SingleUnit';

    constructor(optional: boolean = false) {
        super();
        this.optional = optional;

    }
    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits();
    }
    public getText() {
        return 'target unit';
    }
    public isOptional() {
        return this.optional;
    }
}

export class FriendlyUnit extends SingleUnit {
    protected static id = 'FriendlyUnit';

    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getOwner() === card.getOwner());
    }
    public getText() {
        return 'target friendly unit';
    }

}

export class EnemyUnit extends SingleUnit {
    protected static id = 'EnemyUnit';

    public getValidTargets(card: Card, game: Game) {
        return game.getBoard().getAllUnits().filter(unit => unit.getOwner() !== card.getOwner());
    }
    public getText() {
        return 'target enemy unit';
    }
}


export class AllUnits extends Targeter {
    protected static id = 'AllUnits';
    protected lastTargets: Array<Unit> = [];
    public getText() {
        return 'all units';
    }
    public getPronoun() {
        return 'them';
    }
    public needsInput() {
        return false;
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits();
        return this.lastTargets;
    }
    public getLastTargets() {
        return this.lastTargets;
    }
}

export class AllOtherUnits extends AllUnits {
    protected static id = 'AllOtherUnits';
    public getText() {
        return 'all other units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits().filter(unit => unit !== card);
        return this.lastTargets;
    }
}


export class FriendlyUnits extends AllUnits {
    protected static id = 'FriendlyUnits';
    public getText() {
        return 'friendly units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() === card.getOwner());
        return this.lastTargets;
    }
}

export class EnemyUnits extends AllUnits {
    protected static id = 'EnemyUnits';
    public getText() {
        return 'all enemy units';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() !== card.getOwner());
        return this.lastTargets;
    }
}

export class AllPlayers extends AllUnits {
    protected static id = 'AllPlayers';
    public getText() {
        return 'all players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = [
            game.getPlayer(card.getOwner()),
            game.getPlayer(game.getOtherPlayerNumber(card.getOwner()))
        ];
        return this.lastTargets;
    }
}

export class Everyone extends AllUnits {
    protected static id = 'Everyone';
    public getText() {
        return 'all units and players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .concat(game.getPlayer(card.getOwner()))
            .concat(game.getPlayer(game.getOtherPlayerNumber(card.getOwner())));
        return this.lastTargets;
    }
}

export class Friends extends AllUnits {
    protected static id = 'Friends';
    public getText() {
        return 'all friendly units and players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() === card.getOwner())
            .concat(game.getPlayer(card.getOwner()));
        return this.lastTargets;
    }
}

export class Enemies extends AllUnits {
    protected static id = 'Enemies';
    public getText() {
        return 'all enemy units and players';
    }
    public getTargets(card: Card, game: Game): Array<Unit> {
        this.lastTargets = game.getBoard().getAllUnits()
            .filter(unit => unit.getOwner() !== card.getOwner())
            .concat(game.getPlayer(game.getOtherPlayerNumber(card.getOwner())));
        return this.lastTargets;
    }
}

