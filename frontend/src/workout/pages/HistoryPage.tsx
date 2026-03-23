import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../context';
import type { WorkoutSession, WorkoutSet } from '../types';

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

function formatDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const minutes = Math.floor((end - start) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function SessionCard({
  session,
  sets,
  onClick,
}: {
  session: WorkoutSession;
  sets: WorkoutSet[];
  onClick: () => void;
}) {
  const statusColors = {
    completed: 'bg-green-900/30 border-green-800',
    abandoned: 'bg-red-900/30 border-red-800',
    active: 'bg-blue-900/30 border-blue-800',
  };

  const statusLabels = {
    completed: 'Completed',
    abandoned: 'Abandoned',
    active: 'Active',
  };

  const exerciseCount = new Set(sets.map(s => s.exerciseId)).size;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border ${statusColors[session.status]} hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium capitalize text-gray-300">
          {statusLabels[session.status]}
        </span>
        <span className="text-sm text-gray-400">
          {session.endedAt && formatDuration(session.startedAt, session.endedAt)}
        </span>
      </div>
      <div className="text-white font-medium mb-1">
        {sets.length} sets · {exerciseCount} exercises
      </div>
      <div className="text-sm text-gray-400">
        {formatDateTime(session.startedAt)}
        {session.endedAt && (
          <span> — {new Date(session.endedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </button>
  );
}

function SessionDetail({
  session,
  sets,
  onBack,
}: {
  session: WorkoutSession;
  sets: WorkoutSet[];
  onBack: () => void;
}) {
  const groupedByExercise = sets.reduce(
    (acc, set) => {
      const key = set.exerciseId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(set);
      return acc;
    },
    {} as Record<string, WorkoutSet[]>
  );

  const getExerciseName = (exerciseId: string): string => {
    const exercise = sets.find(s => s.exercise?.id === exerciseId)?.exercise;
    return exercise?.name || 'Unknown Exercise';
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
      >
        ← Back to History
      </button>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-2">Workout Session</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Started:</span>
            <div className="text-white">{formatDateTime(session.startedAt)}</div>
          </div>
          {session.endedAt && (
            <div>
              <span className="text-gray-400">Ended:</span>
              <div className="text-white">{formatDateTime(session.endedAt)}</div>
            </div>
          )}
          {session.endedAt && (
            <div>
              <span className="text-gray-400">Duration:</span>
              <div className="text-white">{formatDuration(session.startedAt, session.endedAt)}</div>
            </div>
          )}
          <div>
            <span className="text-gray-400">Total Sets:</span>
            <div className="text-white">{sets.length}</div>
          </div>
        </div>
      </div>

      {Object.entries(groupedByExercise).map(([exerciseId, exerciseSets]) => (
        <div key={exerciseId} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
            <h3 className="font-semibold text-white">{getExerciseName(exerciseId)}</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {exerciseSets.map((set, index) => (
              <div key={set.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-6">#{index + 1}</span>
                  <span className="text-white">
                    {set.reps} reps @ {set.weight}{set.weightUnit}
                  </span>
                </div>
                {set.notes && (
                  <span className="text-gray-400 text-sm truncate max-w-32">
                    {set.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HistoryPage() {
  const { sessions, sets } = useWorkoutProviders();
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]);
  const [sessionSets, setSessionSets] = useState<Record<string, WorkoutSet[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const sessionsData = await sessions.getAll();
      const completedSessions = sessionsData.filter(
        s => s.status === 'completed' || s.status === 'abandoned'
      );

      if (cancelled) return;

      setAllSessions(completedSessions);

      const setsMap: Record<string, WorkoutSet[]> = {};
      await Promise.all(
        completedSessions.map(async session => {
          const sessionSetsData = await sets.getBySession(session.id);
          setsMap[session.id] = sessionSetsData;
        })
      );

      if (cancelled) return;

      setSessionSets(setsMap);
      setLoading(false);
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [sessions, sets]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2">Workout History</h2>
        </div>
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="space-y-6">
        <SessionDetail
          session={selectedSession}
          sets={sessionSets[selectedSession.id] || []}
          onBack={() => setSelectedSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">Workout History</h2>
        <p className="text-gray-400">
          {allSessions.length} completed {allSessions.length === 1 ? 'session' : 'sessions'}
        </p>
      </div>

      {allSessions.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
          <div className="text-gray-400">
            No completed workouts yet. Start a session to see your history.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              sets={sessionSets[session.id] || []}
              onClick={() => setSelectedSession(session)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
