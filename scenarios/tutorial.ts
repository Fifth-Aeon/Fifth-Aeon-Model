import { Scenario } from '../scenario';

const mission1 = new Scenario({
    name: 'Introduction',
    description: 'Test',
    playerSetups: [
        {
            lifeTotal: 25,
            initialHands: ['Pikeman'],
            initialPermanents: ['Pikeman']
        },
        {
            lifeTotal: 5,
            initialHands: [],
            initialPermanents: []
        }
    ]
});

export const tutorialCampaign = [mission1];
