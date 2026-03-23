import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../context';
import type { WorkoutSession } from '../types';

export function WorkoutSessionPage() {
  const { sessions } = useWorkoutProviders();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSession() {
      const session = await sessions.getActive();
      if (!cancelled) {
        setActiveSession(session);
        setLoading(false);
      }
    }

    loadActiveSession();

    return () => {
      cancelled = true;
    };
  }, [sessions]);

  const handleStartSession = async () => {
    const session = await sessions.create();
    setActiveSession(session);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    const ended = await sessions.end(activeSession.id);
    setActiveSession(null);
    console.log('Session ended:', ended);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Active Workout</h2>
              <p className="text-gray-400 mt-1">
                Started at {new Date(activeSession.startedAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleEndSession}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              End Workout
            </button>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <p className="text-gray-400">
            Set logging will be available in Phase 3.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">No Active Workout</h2>
        <p className="text-gray-400 mb-6">
          Start a new workout session to begin logging your exercises.
        </p>
        <button
          onClick={handleStartSession}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg transition-colors"
        >
          Start Workout
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400">Training Plans</div>
            <div className="text-white font-medium">Coming Soon</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400">Recent Workouts</div>
            <div className="text-white font-medium">Phase 2</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400">Rest Timer</div>
            <div className="text-white font-medium">Phase 7</div>
          </div>
        </div>
      </div>
    </div>
  );
}
