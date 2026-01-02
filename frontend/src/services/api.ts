const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  entries?: GoalEntry[];
}

export interface GoalEntry {
  id: string;
  goalId: string;
  createdAt: string;
}

export interface GoalEntriesResponse {
  entries: GoalEntry[];
  count: number;
  hasEntryToday: boolean;
  hasEntryYesterday: boolean;
}

export const api = {
  async getGoals(): Promise<Goal[]> {
    const response = await fetch(`${API_BASE_URL}/goals`);
    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }
    return response.json();
  },

  async getGoalEntries(goalId: string): Promise<GoalEntriesResponse> {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}/entries`);
    if (!response.ok) {
      throw new Error('Failed to fetch goal entries');
    }
    return response.json();
  },

  async addGoalEntry(goalId: string, date?: Date): Promise<GoalEntry> {
    const body = date ? { createdAt: date.toISOString() } : {};

    const response = await fetch(`${API_BASE_URL}/goals/${goalId}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add goal entry');
    }

    return response.json();
  },
};
