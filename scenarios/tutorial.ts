import { Scenario } from '../scenario';
import { pikeman } from '../cards/renewalCards';
import { testCard } from '../cards/synthCards';

let mission1 = new Scenario({
    name: 'Introduction',
    description: 'Test',
    playerSetups: [{
        lifeTotals: 25,
        initalHands: [pikeman()],
        initialPermanents:  [testCard()]
    }, {
        lifeTotals: 5,
        initalHands: [],
        initialPermanents: [],
    }]
});

export const tutorialCampaign = [mission1];
