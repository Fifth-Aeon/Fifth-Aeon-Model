import { DefaultAI } from './ai/defaultAi';
import { AIConstructor } from './ai/aiList';
import { DeckList } from './deckList';
import { decksByLevel, DifficultyLevel } from './scenarios/decks';
import { sample } from 'lodash';

export type ConcreteDifficulty = Exclude<
    DifficultyLevel,
    DifficultyLevel.Dynamic
>;

export interface AiData {
    selectedDifficulty: DifficultyLevel;

    playerRecord: {
        easy: { wins: number, losses: number },
        medium: { wins: number, losses: number },
        hard: { wins: number, losses: number },
        expert: { wins: number, losses: number }
    };

    autoDifficulty: ConcreteDifficulty;

}

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

    public save: (data: AiData) => void = () => null;

    public recordGameResult(playerWon: boolean) {
        const record = this.getCurrentRecord();
        if (playerWon) {
            record.wins++;
        } else {
            record.losses++;
        }
        if (this.selectedDifficulty === DifficultyLevel.Dynamic) {
            const winRate = record.wins / (record.wins + record.losses);
            if (this.autoDifficulty < DifficultyLevel.Expert && winRate > 0.65) {
                this.autoDifficulty++;
            } else if (this.autoDifficulty > DifficultyLevel.Easy && winRate < 0.45) {
                this.autoDifficulty--;
            }
        }
        this.saveState();
    }

    public load(data: AiData) {
        this.playerRecord = data.playerRecord;
        this.selectedDifficulty = data.selectedDifficulty;
        this.autoDifficulty = data.autoDifficulty;
    }

    public getSelectedDifficulty() {
        return this.selectedDifficulty;
    }

    private saveState() {
        this.save({
            playerRecord: this.playerRecord,
            selectedDifficulty: this.selectedDifficulty,
            autoDifficulty: this.autoDifficulty
        });
    }

    public setDifficulty(difficulty: DifficultyLevel) {
        this.selectedDifficulty = difficulty;
        this.saveState();
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
    }
}

export const aiManager = new AIManager();
