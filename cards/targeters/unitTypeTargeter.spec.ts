import { ServerGame } from 'app/game_model/serverGame';
import { GameFormat, standardFormat } from 'app/game_model/gameFormat';
import { async } from '@angular/core/testing';
import { FriendlyUnitsOfType, UnitsOfTypeAsTarget, UnitsOfType, UnitsNotOfType, UnitOfType } from './unitTypeTargeter';
import { UnitType } from 'app/game_model/card-types/unit';
import { DeckList } from 'app/game_model/deckList';
import { Card } from 'app/game_model/card-types/card';
import { pikeman } from '../renewalCards';
import { lich, skeleton } from '../decayCards';
import { golem } from '../synthCards';

let game = new ServerGame('game', standardFormat, [
    new DeckList(),
    new DeckList()
]);
const host = pikeman();
host.setOwner(0);
const units = [
    [pikeman(), pikeman(), lich(), skeleton()],
    [lich(), skeleton(), pikeman(), golem()]
];


describe('Unit Type Targeters', () => {
    beforeEach(async(() => {
        game = new ServerGame('game', standardFormat, [
            new DeckList(),
            new DeckList()
        ]);
    }));

    it('FriendlyUnitsOfType should return friendly units of the given type', async(() => {
        const targeter = new FriendlyUnitsOfType(UnitType.Soldier);

        targeter.getUnitTargets(host, game);
        expect(targeter.getUnitTargets(host, game).length).toBe(0);

        game.playGeneratedUnit(1, pikeman());
        targeter.getUnitTargets(host, game);
        expect(targeter.getUnitTargets(host, game).length).toBe(0);

        game.playGeneratedUnit(0, lich());
        targeter.getUnitTargets(host, game);
        expect(targeter.getUnitTargets(host, game).length).toBe(0);

        game.playGeneratedUnit(0, pikeman());
        targeter.getUnitTargets(host, game);
        expect(targeter.getUnitTargets(host, game).length).toBe(1);
    }));

    it('UnitsOfTypeAsTarget should return units of the same type as the target', async(() => {
        const targeter = new UnitsOfTypeAsTarget();
        for (let playerNumber = 0; playerNumber < units.length; playerNumber++) {
            for (const unit of units[playerNumber]) {
                game.playGeneratedUnit(playerNumber, unit);
            }
        }

        targeter.setTargets([units[0][0]]);
        expect(targeter.getUnitTargets(host, game).length).toBe(3);
        expect(targeter.getUnitTargets(host, game)).toContain(units[0][1]);
        expect(targeter.getUnitTargets(host, game)).toContain(units[1][2]);

        targeter.setTargets([units[1][0]]);
        expect(targeter.getUnitTargets(host, game).length).toBe(4);
        expect(targeter.getUnitTargets(host, game)).toContain(units[1][1]);
    }));

    it('UnitsOfType should return units of the same type as given', async(() => {
        for (let playerNumber = 0; playerNumber < units.length; playerNumber++) {
            for (const unit of units[playerNumber]) {
                game.playGeneratedUnit(playerNumber, unit);
            }
        }

        expect(new UnitsOfType(UnitType.Soldier).getUnitTargets(host, game).length).toBe(3);
        expect(new UnitsOfType(UnitType.Undead).getUnitTargets(host, game).length).toBe(4);
        expect(new UnitsOfType(UnitType.Automaton).getUnitTargets(host, game).length).toBe(1);
        expect(new UnitsOfType(UnitType.Agent).getUnitTargets(host, game).length).toBe(0);
    }));

    it('UnitsNotOfType should return units not of the same type as given', async(() => {
        for (let playerNumber = 0; playerNumber < units.length; playerNumber++) {
            for (const unit of units[playerNumber]) {
                game.playGeneratedUnit(playerNumber, unit);
            }
        }

        expect(new UnitsNotOfType(UnitType.Soldier).getUnitTargets(host, game).length).toBe(8 - 3);
        expect(new UnitsNotOfType(UnitType.Undead).getUnitTargets(host, game).length).toBe(8 - 4);
        expect(new UnitsNotOfType(UnitType.Automaton).getUnitTargets(host, game).length).toBe(8 - 1);
        expect(new UnitsNotOfType(UnitType.Agent).getUnitTargets(host, game).length).toBe(8 - 0);
    }));

    it('UnitOfType should be able to target units of the same type as given', async(() => {
        for (let playerNumber = 0; playerNumber < units.length; playerNumber++) {
            for (const unit of units[playerNumber]) {
                game.playGeneratedUnit(playerNumber, unit);
            }
        }

        expect(new UnitOfType(UnitType.Soldier).getValidTargets(host, game).length).toBe(3);
        expect(new UnitOfType(UnitType.Undead).getValidTargets(host, game).length).toBe(4);
        expect(new UnitOfType(UnitType.Automaton).getValidTargets(host, game).length).toBe(1);
        expect(new UnitOfType(UnitType.Agent).getValidTargets(host, game).length).toBe(0);
    }));
});
