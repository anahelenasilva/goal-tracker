import { useCallback, useEffect, useState } from 'react';
import type { Goal, GoalEntry } from '../services/api';
import { api } from '../services/api';
import { EntryList } from './EntryList';

interface GoalColumnProps {
  goal: Goal;
  onEntryAdded?: () => void;
}

export function GoalColumn({ goal, onEntryAdded }: GoalColumnProps) {
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [count, setCount] = useState(0);
  const [hasEntryToday, setHasEntryToday] = useState(false);
  const [hasEntryYesterday, setHasEntryYesterday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGoalEntries(goal.id);
      setEntries(data.entries);
      setCount(data.count);
      setHasEntryToday(data.hasEntryToday);
      setHasEntryYesterday(data.hasEntryYesterday);
    } catch (err) {
      setError('Failed to load entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [goal.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAddEntry = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.addGoalEntry(goal.id);
      await loadEntries();
      onEntryAdded?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add entry');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddYesterdayEntry = async () => {
    try {
      setLoading(true);
      setError(null);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await api.addGoalEntry(goal.id, yesterday);
      await loadEntries();
      onEntryAdded?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add yesterday entry');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white capitalize mb-2">
          {goal.title}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-gray-400 text-sm">
            Total entries: <span className="font-semibold text-gray-200">{count}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleAddYesterdayEntry}
              disabled={hasEntryYesterday || loading}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md font-medium text-sm transition-colors ${hasEntryYesterday || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
            >
              {loading ? 'Adding...' : hasEntryYesterday ? 'Logged Yesterday' : 'Yesterday'}
            </button>
            <button
              onClick={handleAddEntry}
              disabled={hasEntryToday || loading}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md font-medium text-sm transition-colors ${hasEntryToday || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
            >
              {loading ? 'Adding...' : hasEntryToday ? 'Added Today' : 'Add Entry'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded">
          {error}
        </div>
      )}

      <EntryList entries={entries} loading={loading} />
    </div>
  );
}
