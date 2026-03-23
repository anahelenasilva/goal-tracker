import { useCallback, useEffect, useState } from 'react';
import { useWorkoutProviders } from '../context';
import { SetList, SetLoggingForm } from '../components';
import type { WorkoutSession, WorkoutSet, WeightUnit } from '../types';

export function WorkoutSessionPage() {
  const { sessions, sets } = useWorkoutProviders();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState(false);

  const loadActiveSession = useCallback(async () => {
    setLoading(true);
    const session = await sessions.getActive();
    setActiveSession(session);
    if (session) {
      const sessionSetsData = await sets.getBySession(session.id);
      setSessionSets(sessionSetsData);
    }
    setLoading(false);
  }, [sessions, sets]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  const handleStartSession = async () => {
    const session = await sessions.create();
    setActiveSession(session);
    setSessionSets([]);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
    try {
      const ended = await sessions.end(activeSession.id);
      setActiveSession(null);
      setSessionSets([]);
      console.log('Session ended:', ended);
    } finally {
      setEndingSession(false);
    }
  };

  const handleLogSet = async (data: {
    exerciseId: string;
    reps: number;
    weight: number;
    weightUnit: WeightUnit;
    notes?: string;
  }) => {
    if (!activeSession) return;
    const newSet = await sets.add(activeSession.id, {
      exerciseId: data.exerciseId,
      reps: data.reps,
      weight: data.weight,
      weightUnit: data.weightUnit,
      notes: data.notes,
    });
    setSessionSets((prev) => [...prev, newSet]);
  };

  const handleDeleteSet = async (setId: string) => {
    await sets.delete(setId);
    setSessionSets((prev) => prev.filter((s) => s.id !== setId));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (activeSession) {
    const sessionDuration = Math.floor(
      (Date.now() - new Date(activeSession.startedAt).getTime()) / 60000
    );

    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Active Workout</h2>
              <p className="text-gray-400 mt-1">
                Started at {new Date(activeSession.startedAt).toLocaleTimeString()} ({sessionDuration} min)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{sessionSets.length}</div>
                <div className="text-sm text-gray-400">sets</div>
              </div>
              <button
                onClick={handleEndSession}
                disabled={endingSession}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {endingSession ? 'Ending...' : 'End Workout'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Log Set</h3>
            <SetLoggingForm
              onSubmit={handleLogSet}
              lastSet={sessionSets.length > 0 ? sessionSets[sessionSets.length - 1] : null}
            />
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Logged Sets</h3>
            <SetList sets={sessionSets} onDelete={handleDeleteSet} />
          </div>
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
            <div className="text-white font-medium">Browse Plans</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400">Recent Workouts</div>
            <div className="text-white font-medium">View History</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400">Rest Timer</div>
            <div className="text-white font-medium">Open Timer</div>
          </div>
        </div>
      </div>
    </div>
  );
}