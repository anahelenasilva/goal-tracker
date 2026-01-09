import { useEffect, useRef, useState } from 'react';
import { GoalColumn } from '../components/GoalColumn';
import { Timeline, type TimelineRef } from '../components/Timeline';
import type { Goal } from '../services/api';
import { api } from '../services/api';

export function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timelineRef = useRef<TimelineRef>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [goalsData, statsData] = await Promise.all([
        api.getGoals(),
        api.getStats(),
      ]);
      setGoals(goalsData);
      setTotalDays(statsData.totalDays);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryAdded = async () => {
    // Refresh stats and timeline when an entry is added
    try {
      const statsData = await api.getStats();
      setTotalDays(statsData.totalDays);
      await timelineRef.current?.refresh();
    } catch (err) {
      console.error('Failed to refresh data after entry added:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          2026 Goal Tracker
        </h1>

        {totalDays !== null && (
          <p className="text-xl text-gray-400 mb-8 text-center">
            Total unique days: <span className="font-semibold text-gray-200">{totalDays}</span>
          </p>
        )}

        <Timeline ref={timelineRef} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <GoalColumn key={goal.id} goal={goal} onEntryAdded={handleEntryAdded} />
          ))}
        </div>
      </div>
    </div>
  );
}

