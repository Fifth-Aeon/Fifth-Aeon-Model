import { Card, CardType } from '../../card-types/card';
import { Enchantment } from '../../card-types/enchantment';
import { Game } from '../../game';

import { Mechanic } from '../../mechanic';
import { Player } from '../../player';
import { Unit } from '../../card-types/unit';

abstract class ShieldEnchantment extends Mechanic {
    protected static validCardTypes = new Set([CardType.Enchantment]);
    protected abstract effect(
        enchantment: Enchantment,
        owner: Player,
        amount: number,
        source: Card
    ): number;

    public enter(card: Card, game: Game) {
        const enchantment = card as Enchantment;
        game.getPlayer(enchantment.getOwner())
            .getEvents()
            .takeDamage.addEvent(this, params => {
                const player = params.target as Player;
                const amount = params.amount as number;
                const source = params.source as Card;
                params.amount = this.effect(
                    enchantment,
                    player,
                    amount,
                    source
                );
                return params;
            });
    }

    public remove(card: Card, game: Game) {
        game.getPlayer(card.getOwner())
            .getEvents()
            .removeEvents(this);
    }
}

export class PreventAllDamage extends ShieldEnchantment {
    protected static id = 'PreventAllDamage';

    protected effect(enchantment: Enchantment, owner: Player, amount: number) {
        return 0;
    }

    public getText(card: Card) {
        return `Prevent all damage that would be dealt to you.`;
    }

    public evaluate(card: Card) {
        return (card as Enchantment).getPower() * 7;
    }
}

export class ForceField extends ShieldEnchantment {
    protected static id = 'ForceField';

    protected effect(enchantment: Enchantment, owner: Player, amount: number) {
        const power = enchantment.getPower();
        const reduced = Math.max(0, amount - power);
        enchantment.changePower(-amount);
        return reduced;
    }

    public getText(card: Card) {
        return `Whenever you would take damage prevent it and remove that much power from this enchantment.`;
    }

    public evaluate(card: Card) {
        return (card as Enchantment).getPower();
    }
}

export class DeathCounter extends ShieldEnchantment {
    protected static id = 'DeathCounter';

    protected effect(
        enchantment: Enchantment,
        owner: Player,
        amount: number,
        source: Card
    ) {
        if (source.getCardType() === CardType.Unit) {
            (source as Unit).kill(true);
            enchantment.changePower(-1);
        }
        return amount;
    }

    public getText(card: Card) {
        return `Whenever a unit damages you kill it and remove one power from this enchantment.`;
    }

    public evaluate(card: Card) {
        return (card as Enchantment).getPower() * 6;
    }
}
