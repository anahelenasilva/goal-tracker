import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkoutProviders } from '../hooks';
import { PlanSelectionPanel, PlannedExercisesPanel, SetList, SetLoggingForm } from '../components';
import type { WorkoutSession, WorkoutSet, WeightUnit } from '../types';

export function WorkoutSessionPage() {
  const { sessions, sets } = useWorkoutProviders();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);

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

  const handleStartSession = async (planId?: string) => {
    const session = await sessions.create(planId);
    setActiveSession(session);
    setSessionSets([]);
    setShowPlanSelection(false);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
    try {
      const ended = await sessions.end(activeSession.id);
      setActiveSession(null);
      setSessionSets([]);
      navigate('/workout/history', { state: { sessionId: ended.id } });
    } finally {
      setEndingSession(false);
    }
  };

  const handleLogSet = async (data: {
    exerciseId: string;
    reps: number;
    weight: number | null;
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
      <div className="text-center py-12" role="status" aria-live="polite">
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
        <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Active Workout</h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Started at {new Date(activeSession.startedAt).toLocaleTimeString()} ({sessionDuration} min)
              </p>
              {activeSession.plan && (
                <p className="text-blue-400 text-sm mt-1">
                  Plan: {activeSession.plan.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-white">{sessionSets.length}</div>
                <div className="text-xs sm:text-sm text-gray-400">sets</div>
              </div>
              <button
                onClick={handleEndSession}
                disabled={endingSession}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {endingSession ? 'Ending...' : 'End'}
              </button>
            </div>
          </div>
        </div>

        {activeSession.plan && (
          <PlannedExercisesPanel
            plan={activeSession.plan}
            sessionSets={sessionSets}
            onQuickAdd={handleLogSet}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Log Set</h3>
            <SetLoggingForm
              onSubmit={handleLogSet}
              lastSet={sessionSets.length > 0 ? sessionSets[sessionSets.length - 1] : null}
              allowedExerciseIds={activeSession.plan?.exerciseIds}
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

  if (showPlanSelection) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose a Plan</h2>
              <p className="text-gray-400">
                Select a training plan to guide your workout, or start a blank session.
              </p>
            </div>
            <button
              onClick={() => setShowPlanSelection(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        <PlanSelectionPanel
          onStartWithPlan={(planId) => handleStartSession(planId)}
          onStartWithoutPlan={() => handleStartSession()}
        />
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => handleStartSession()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg transition-colors"
          >
            Start Workout
          </button>
          <button
            onClick={() => setShowPlanSelection(true)}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-lg transition-colors border border-gray-700"
          >
            Start from Plan
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/workout/plans" className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors">
            <div className="text-gray-400">Training Plans</div>
            <div className="text-white font-medium">Browse Plans</div>
          </Link>
          <Link to="/workout/history" className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors">
            <div className="text-gray-400">Recent Workouts</div>
            <div className="text-white font-medium">View History</div>
          </Link>
          <Link to="/workout/timer" className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors">
            <div className="text-gray-400">Rest Timer</div>
            <div className="text-white font-medium">Open Timer</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
