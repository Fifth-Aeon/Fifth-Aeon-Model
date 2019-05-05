import { Scenario } from '../scenario';

const mission1 = new Scenario({
    name: 'Introduction',
    description: 'Test',
    playerSetups: [
        {
            lifeTotal: 25,
            initialHand: ['Pikeman'],
            initialPermanents: ['Pikeman']
        },
        {
            lifeTotal: 5,
            initialHand: [],
            initialPermanents: []
        }
    ]
});

export const tutorialCampaign = [mission1];
