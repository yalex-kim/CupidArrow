import type { RankingEntry } from './notionService';
import { getRankingsFromNotion, saveRankingToNotion } from './notionService';

export class RankingManager {
  private rankings: RankingEntry[] = [
    { name: "화살마스터", score: 2500, level: 4 },
    { name: "천사", score: 2000, level: 4 },
    { name: "하트", score: 1800, level: 4 },
    { name: "사랑이", score: 1500, level: 3 },
    { name: "화살", score: 1200, level: 3 },
    { name: "핑크", score: 1000, level: 2 },
    { name: "로맨스", score: 800, level: 2 },
    { name: "달링", score: 600, level: 2 },
    { name: "허니", score: 400, level: 1 },
    { name: "러브", score: 200, level: 1 }
  ];
  
  private isLoading = false;

  constructor() {
    this.loadInitialRankings();
  }

  private async loadInitialRankings(): Promise<void> {
    const notionRankings = await getRankingsFromNotion();
    if (notionRankings.length > 0) {
      this.rankings = notionRankings;
    }
  }

  async refreshRankings(): Promise<RankingEntry[]> {
    this.isLoading = true;
    try {
      const notionRankings = await getRankingsFromNotion();
      if (notionRankings.length > 0) {
        this.rankings = notionRankings;
      }
      return this.rankings;
    } finally {
      this.isLoading = false;
    }
  }

  getRankings(): RankingEntry[] {
    return [...this.rankings];
  }

  isLoadingRankings(): boolean {
    return this.isLoading;
  }

  checkRankingEligibility(finalScore: number): boolean {
    const lowestRankingScore = this.rankings.length >= 10 ? this.rankings[9].score : 0;
    return finalScore > lowestRankingScore || this.rankings.length < 10;
  }

  async submitRanking(playerName: string, finalScore: number, level: number): Promise<boolean> {
    if (!playerName.trim()) return false;
    
    const newEntry: RankingEntry = {
      name: playerName.trim(),
      score: finalScore,
      level: level
    };
    
    this.isLoading = true;
    
    try {
      const success = await saveRankingToNotion(newEntry);
      
      if (success) {
        const updatedRankings = await getRankingsFromNotion();
        if (updatedRankings.length > 0) {
          this.rankings = updatedRankings;
        } else {
          // Fallback to local update
          this.updateLocalRankings(newEntry);
        }
      } else {
        // Fallback to local update
        this.updateLocalRankings(newEntry);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to submit ranking:', error);
      this.updateLocalRankings(newEntry);
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  private updateLocalRankings(newEntry: RankingEntry): void {
    this.rankings = [...this.rankings, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  findPlayerRanking(playerName: string, score: number): number {
    const index = this.rankings.findIndex(entry => 
      entry.name === playerName && entry.score === score
    );
    return index >= 0 ? index + 1 : -1;
  }
}