export type GoalType = 'exercise' | 'treadmill';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;
  createdAt: string;
  entries?: GoalEntry[];
}

export interface GoalEntry {
  id: string;
  goalId: string;
  value: number | null;
  createdAt: string;
  goal?: {
    id: string;
    title: string;
  };
}

export interface GoalEntriesResponse {
  entries: GoalEntry[];
  count: number;
  hasEntryToday: boolean;
  hasEntryYesterday: boolean;
}

export interface StatsResponse {
  totalDays: number;
}

export const getApiBaseUrl = (): string => {
  if (import.meta.env.MODE === 'development') {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
  }

  //not the best solution, but it works for now; will improve later
  if (import.meta.env.VITE_API_BASE_URL?.includes("railway.app")) {
    return `${import.meta.env.VITE_API_BASE_URL}`
  }

  // If running in browser, use current hostname
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3005'; // Your API port
    return `${protocol}//${hostname}:${port}`;
  }

  // Fallback for server-side rendering (SSR)
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
}

export const api = {
  async getGoals(): Promise<Goal[]> {
    const response = await fetch(`${getApiBaseUrl()}/goals`);
    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }
    return response.json();
  },

  async getGoalEntries(goalId: string): Promise<GoalEntriesResponse> {
    const response = await fetch(`${getApiBaseUrl()}/goals/${goalId}/entries`);
    if (!response.ok) {
      throw new Error('Failed to fetch goal entries');
    }
    return response.json();
  },

  async addGoalEntry(goalId: string, date?: Date, value?: number): Promise<GoalEntry> {
    const body: Record<string, unknown> = {};
    if (date) {
      body.createdAt = date.toISOString();
    }
    if (value !== undefined) {
      body.value = value;
    }

    const response = await fetch(`${getApiBaseUrl()}/goals/${goalId}/entries`, {
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

  async getStats(): Promise<StatsResponse> {
    const response = await fetch(`${getApiBaseUrl()}/goals/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return response.json();
  },

  async getAllEntriesTimeline(): Promise<GoalEntry[]> {
    const response = await fetch(`${getApiBaseUrl()}/goals/entries/timeline`);
    if (!response.ok) {
      throw new Error('Failed to fetch timeline entries');
    }

    return response.json();
  },
};
