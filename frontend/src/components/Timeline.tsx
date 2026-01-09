import { forwardRef, useImperativeHandle, useState } from 'react';
import type { GoalEntry } from '../services/api';
import { api } from '../services/api';

interface TimelineProps {
  onEntriesLoad?: () => void;
}

export interface TimelineRef {
  refresh: () => Promise<void>;
}

export const Timeline = forwardRef<TimelineRef, TimelineProps>(({ onEntriesLoad }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllEntriesTimeline();
      setEntries(data);
      setHasLoaded(true);
      onEntriesLoad?.();
    } catch (err) {
      setError('Failed to load timeline entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      if (isExpanded) {
        await loadEntries();
      }
    },
  }));

  const handleToggle = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded && !hasLoaded) {
      await loadEntries();
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-6 mb-6">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-2xl font-bold text-white">Timeline</h2>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4">
          {loading && (
            <div className="text-center py-8 text-gray-400">
              Loading timeline...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded">
              {error}
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No entries yet. Start tracking your goals!
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="space-y-2">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <time className="text-sm text-gray-300">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                      <span className="text-sm text-gray-400 capitalize">
                        {entry.goal?.title || 'Unknown Goal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

Timeline.displayName = 'Timeline';

