import { Scenario } from '../scenario';
import { pikeman } from '../cards/renewalCards';

let mission1 = new Scenario({
    name: 'Introduction',
    description: 'Test',
    playerSetups: [{
        lifeTotals: 25,
        initalHands: [pikeman()],
        initialPermanents:  [pikeman()]
    }, {
        lifeTotals: 5,
        initalHands: [],
        initialPermanents: [],
    }]
});

export const tutorialCampaign = [mission1];
