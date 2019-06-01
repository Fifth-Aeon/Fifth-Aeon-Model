/**
 * Determines which heuristic to be used when the A.I makes a choice.
 * Choices are any time the game asks a user to select 1 or more cards,
 * such as when discarding or searching their deck.
 */
export enum ChoiceHeuristic {
    DrawHeuristic,
    DiscardHeuristic,
    ReplaceHeuristic,
    HighestStatsHeuristic
}
