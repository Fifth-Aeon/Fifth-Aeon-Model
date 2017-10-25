import { Mechanic, TargetedMechanic, EvalContext } from '../../mechanic';
import { Game } from '../../Game';
import { Targeter } from '../../targeter';
import { Card } from '../../card';
import { Unit, UnitType } from '../../unit';
import { GameEvent, EventType } from '../../gameEvent';
import { CannotAttack, CannotBlock } from './cantAttack';

import { remove } from 'lodash';

