import { DefaultAI } from './ai/defaultAi';
import { AIConstructor } from './ai/aiList';
import { DeckList } from './deckList';
import { allDecks, decksByLevel, DifficultyLevel } from './scenarios/decks';
import { sample } from 'lodash';

export type ConcreteDifficulty = Exclude<
    DifficultyLevel,
    DifficultyLevel.Dynamic
>;

/**
 * Used to get A.I. opponents and decks for
 */
class AIManager {
    private selectedDifficulty = DifficultyLevel.Dynamic;
    private autoDifficulty: ConcreteDifficulty = DifficultyLevel.Easy;
    private playerRecord = {
        easy: { wins: 0, losses: 0 },
        medium: { wins: 0, losses: 0 },
        hard: { wins: 0, losses: 0 },
        expert: { wins: 0, losses: 0 }
    };

    public recordGameResult(playerWon: boolean) {
        const record = this.getCurrentRecord();
        if (playerWon) {
            record.wins++;
        } else {
            record.losses++;
        }
        const winRate = record.wins / (record.wins + record.losses);
        if (this.selectedDifficulty !== DifficultyLevel.Dynamic) {
            return;
        }
        if (this.autoDifficulty < DifficultyLevel.Expert && winRate > 0.65) {
            this.autoDifficulty++;
        } else if (this.autoDifficulty > DifficultyLevel.Easy && winRate < 0.45) {
            this.autoDifficulty--;
        }
    }

    private getCurrentRecord() {
        switch (this.getCurrentDifficulty()) {
            case DifficultyLevel.Easy:
                return this.playerRecord.easy;
            case DifficultyLevel.Medium:
                return this.playerRecord.medium;
            case DifficultyLevel.Hard:
                return this.playerRecord.hard;
            case DifficultyLevel.Expert:
                return this.playerRecord.expert;
        }
    }

    private getCurrentDifficulty(): ConcreteDifficulty {
        if (this.selectedDifficulty !== DifficultyLevel.Dynamic) {
            return this.selectedDifficulty;
        }
        return this.autoDifficulty;
    }

    public getLeveledOpponent() {
        return {
            ai: this.getLeveledAI(),
            deck: this.getLeveledDeck()
        };
    }

    private getLeveledAI(): AIConstructor {
        return DefaultAI;
    }

    public getLeveledDeck(): DeckList {
        switch (this.getCurrentDifficulty()) {
            case DifficultyLevel.Easy:
                return sample(decksByLevel.easy) as DeckList;
            case DifficultyLevel.Medium:
                return sample(decksByLevel.medium) as DeckList;
            case DifficultyLevel.Hard:
                return sample(decksByLevel.hard) as DeckList;
            case DifficultyLevel.Expert:
                return sample(decksByLevel.expert) as DeckList;
        }
        return sample(allDecks) as DeckList;
    }
}

export const aiManger = new AIManager();
