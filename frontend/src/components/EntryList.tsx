import type { GoalEntry } from '../services/api';

interface EntryListProps {
  entries: GoalEntry[];
  loading: boolean;
}

export function EntryList({ entries, loading }: EntryListProps) {
  if (loading && entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Loading entries...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No entries yet. Add your first entry!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Entries</h3>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="p-3 bg-gray-800 rounded border border-gray-700 hover:bg-gray-750 transition-colors"
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
          </div>
        ))}
      </div>
    </div>
  );
}

