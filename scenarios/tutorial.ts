import { Scenario } from '../scenario';
import { pikeman } from '../cards/renewalCards';

let mission1 = new Scenario({
    name: 'Introduction',
    description: 'Test',
    playerSetups: [{
        lifeTotals: 25,
        initialHands: [pikeman()],
        initialPermanents:  [pikeman()]
    }, {
        lifeTotals: 5,
        initialHands: [],
        initialPermanents: [],
    }]
});

export const tutorialCampaign = [mission1];
