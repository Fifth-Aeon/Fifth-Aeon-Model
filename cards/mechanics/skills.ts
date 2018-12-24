import { Card, CardType } from '../../card-types/card';
import { Game } from '../../game';
import { EvalContext, Mechanic } from '../../mechanic';
import { Unit, UnitType } from '../../card-types/unit';

abstract class Skill extends Mechanic {
    protected static validCardTypes = new Set([CardType.Unit, CardType.Item]);
}

export class Flying extends Skill {
    protected static id = 'Flying';

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().checkBlockable.addEvent(this, params => {
            const blocker = params.blocker as Unit;
            if (
                !blocker.hasMechanicWithId(Flying.id) &&
                !blocker.hasMechanicWithId(Ranged.getId())
            ) {
                params.canBlock = false;
            }
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Flying.`;
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.3 };
    }
}

export class Unblockable extends Skill {
    protected static id = 'Unblockable';

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().checkBlockable.addEvent(this, params => {
            params.canBlock = false;
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Unblockable.`;
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.75 };
    }
}

export class Rush extends Skill {
    protected static id = 'Rush';

    public enter(card: Card, game: Game) {
        (card as Unit).refresh();
    }

    public getText(card: Card) {
        return `Rush.`;
    }

    public evaluate(card: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.Play) {
            return { addend: 0, multiplier: 1.2 };
        }
        return 0;
    }
}

export class Aquatic extends Skill {
    protected static id = 'Aquatic';

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().checkBlockable.addEvent(this, params => {
            const blocker = params.blocker as Unit;
            if (
                !blocker.hasMechanicWithId(Aquatic.getId()) &&
                !blocker.hasMechanicWithId(Flying.getId())
            ) {
                params.canBlock = false;
            }
            return params;
        });
        (card as Unit).getEvents().checkCanBlock.addEvent(this, params => {
            const attacker = params.attacker as Unit;
            if (!attacker.hasMechanicWithId(Aquatic.getId())) {
                params.canBlock = false;
            }
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Aquatic.`;
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.1 };
    }
}

export class Ranged extends Skill {
    protected static id = 'Ranged';

    public enter(card: Card, game: Game) {}

    public getText(card: Card) {
        return `Ranged.`;
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.1 };
    }
}

export class Lifesteal extends Skill {
    protected static id = 'Lifesteal';

    public enter(card: Card, game: Game) {
        (card as Unit).getEvents().dealDamage.addEvent(this, params => {
            game.getPlayer(card.getOwner()).addLife(params.amount);
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Lifesteal.`;
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.3 };
    }
}

export class Lethal extends Skill {
    protected static id = 'Lethal';

    public enter(card: Card, game: Game) {
        card.getEvents().dealDamage.addEvent(this, params => {
            if (params.target.getUnitType() !== UnitType.Player) {
                params.target.die();
            }
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Lethal.`;
    }

    public evaluate(card: Card) {
        return 3;
    }
}

export class Shielded extends Skill {
    protected static id = 'Shielded';

    protected validCardTypes = new Set([CardType.Unit, CardType.Item]);
    private depleted = false;
    public enter(card: Card, game: Game) {
        this.depleted = false;
        (card as Unit).getEvents().takeDamage.addEvent(this, params => {
            if (this.depleted || params.amount === 0) {
                return params;
            }
            params.amount = 0;
            this.depleted = true;
        });
    }

    public remove(card: Card, game: Game) {
        this.depleted = false;
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        if (this.depleted) {
            return '[depleted]Shielded.[/depleted]';
        }
        return `Shielded.`;
    }

    public stack() {
        this.depleted = false;
    }

    public isDepleted() {
        return this.depleted;
    }

    public evaluate(card: Card) {
        if (!this.depleted) {
            return { addend: 0, multiplier: 1.25 };
        }
        return 0;
    }
}

export class Relentless extends Skill {
    protected static id = 'Relentless';

    public enter(card: Card, game: Game) {
        game.getEvents().endOfTurn.addEvent(this, params => {
            const target = card as Unit;
            target.refresh();
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Relentless.`;
    }

    public evaluate(card: Card) {
        return { addend: 0, multiplier: 1.25 };
    }
}

export class Deathless extends Skill {
    protected static id = 'Deathless';

    constructor(private charges: number = 1) {
        super();
    }

    public enter(card: Card, game: Game) {
        const unit = card as Unit;
        unit.getEvents().death.addEvent(this, params => {
            game.getEvents().endOfTurn.addEvent(this, _ => {
                this.charges--;
                if (this.charges <= 0) {
                    unit.removeMechanic(this.getId(), game);
                }
                game.playFromCrypt(unit);
                game.gameEvents.removeEvents(this);
            });
            return params;
        });
    }

    public clone() {
        return new Deathless(this.charges);
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        if (this.charges === 1) {
            return 'Deathless.';
        } else {
            return `Deathless (${this.charges}).`;
        }
    }

    public evaluate(card: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.LethalRemoval) {
            return { addend: 0, multiplier: 0.5 };
        }
        return { addend: 0, multiplier: 1.5 };
    }
}

export class Immortal extends Skill {
    protected static id = 'Immortal';

    public enter(card: Card, game: Game) {
        const unit = card as Unit;
        unit.getEvents().death.addEvent(this, params => {
            game.getEvents().endOfTurn.addEvent(this, _ => {
                game.playFromCrypt(unit);
            });
            return params;
        });
    }

    public remove(card: Card, game: Game) {
        (card as Unit).getEvents().removeEvents(this);
    }

    public getText(card: Card) {
        return `Immortal.`;
    }

    public evaluate(card: Card, game: Game, context: EvalContext) {
        if (context === EvalContext.LethalRemoval) {
            return { addend: 0, multiplier: 0.1 };
        }
        return { addend: 0, multiplier: 3 };
    }
}
