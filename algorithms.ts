export interface KnapsackItem<T> {
    w: number;
    b: number;
    data: T;
}

// Knapsack algorithm
// Credits to Dan Woodson (adapted to typescript)
// https://gist.github.com/danwoods/7496329

// wikipedia: [Knapsack (0/1)](http://en.wikipedia.org/wiki/Knapsack_problem#0.2F1_Knapsack_Problem)
// Given a set `[{weight:Number, benefit:Number}]` and a capacity,
// find the maximum value possible while keeping the weight below
// or equal to the capacity
export function knapsack<T>(capacity: number, items: KnapsackItem<T>[]) {
    capacity = Math.max(capacity, 0);
    let idxItem = 0,
        idxWeight = 0,
        oldMax = 0,
        newMax = 0;
    const numItems = items.length,
        weightMatrix = new Array(numItems + 1),
        keepMatrix = new Array(numItems + 1),
        solutionSet = [];

    // Setup matrices
    for (idxItem = 0; idxItem < numItems + 1; idxItem++) {
        weightMatrix[idxItem] = new Array(capacity + 1);
        keepMatrix[idxItem] = new Array(capacity + 1);
    }

    // Build weightMatrix from [0][0] -> [numItems-1][capacity-1]
    for (idxItem = 0; idxItem <= numItems; idxItem++) {
        for (idxWeight = 0; idxWeight <= capacity; idxWeight++) {
            // Fill top row and left column with zeros
            if (idxItem === 0 || idxWeight === 0) {
                weightMatrix[idxItem][idxWeight] = 0;
            } else if (items[idxItem - 1].w <= idxWeight) {
                newMax =
                    items[idxItem - 1].b +
                    weightMatrix[idxItem - 1][idxWeight - items[idxItem - 1].w];
                oldMax = weightMatrix[idxItem - 1][idxWeight];

                // Update the matrices
                if (newMax > oldMax) {
                    weightMatrix[idxItem][idxWeight] = newMax;
                    keepMatrix[idxItem][idxWeight] = 1;
                } else {
                    weightMatrix[idxItem][idxWeight] = oldMax;
                    keepMatrix[idxItem][idxWeight] = 0;
                }
            } else {
                weightMatrix[idxItem][idxWeight] =
                    weightMatrix[idxItem - 1][idxWeight];
            }
        }
    }

    // Traverse through keepMatrix ([numItems][capacity] -> [1][?])
    // to create solutionSet
    idxWeight = capacity;
    idxItem = numItems;
    for (idxItem; idxItem > 0; idxItem--) {
        if (keepMatrix[idxItem][idxWeight] === 1) {
            solutionSet.push(items[idxItem - 1]);
            idxWeight = idxWeight - items[idxItem - 1].w;
        }
    }
    return {
        maxValue: weightMatrix[numItems][capacity] as number,
        set: solutionSet as KnapsackItem<T>[]
    };
}
