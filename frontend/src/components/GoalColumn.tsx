import { useCallback, useEffect, useState } from 'react';
import type { Goal, GoalEntry } from '../services/api';
import { api } from '../services/api';
import { DaylogExportButton } from '../workout/components';

interface GoalColumnProps {
  goal: Goal;
  onEntryAdded?: () => void;
}

export function GoalColumn({ goal, onEntryAdded }: GoalColumnProps) {
  const isTreadmillGoal = goal.type === 'treadmill';
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [count, setCount] = useState(0);
  const [hasEntryToday, setHasEntryToday] = useState(false);
  const [hasEntryYesterday, setHasEntryYesterday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<number | undefined>(undefined);
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
      await api.addGoalEntry(
        goal.id,
        undefined,
        isTreadmillGoal ? value : undefined,
      );
      await loadEntries();
      setValue(undefined);
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
      await api.addGoalEntry(
        goal.id,
        yesterday,
        isTreadmillGoal ? value : undefined,
      );
      await loadEntries();
      setValue(undefined);
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

  const hasValidValue = !isTreadmillGoal || (value !== undefined && value > 0);

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white capitalize mb-2">
          {goal.title}
        </h2>
        {isTreadmillGoal && (
          <div className="mb-3">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="min"
              value={value ?? ''}
              onChange={(event) => {
                const nextValue = event.target.valueAsNumber;
                if (Number.isNaN(nextValue)) {
                  setValue(undefined);
                  return;
                }
                setValue(nextValue);
              }}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-gray-400 text-sm">
            Total entries: <span className="font-semibold text-gray-200">{count}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleAddYesterdayEntry}
              disabled={hasEntryYesterday || loading || !hasValidValue}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md font-medium text-sm transition-colors ${hasEntryYesterday || loading || !hasValidValue
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
            >
              {loading ? 'Adding...' : hasEntryYesterday ? 'Logged Yesterday' : 'Yesterday'}
            </button>
            <button
              onClick={handleAddEntry}
              disabled={hasEntryToday || loading || !hasValidValue}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md font-medium text-sm transition-colors ${hasEntryToday || loading || !hasValidValue
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

      {loading && entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Loading entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No entries yet. Add your first entry!
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Entries</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors flex items-center justify-between gap-2"
              >
                <time className="text-sm text-gray-300">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {entry.value !== null && ` - ${entry.value} min`}
                </time>
                {goal.type === 'treadmill' && entry.value != null && (
                  <DaylogExportButton treadmillEntry={entry} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
