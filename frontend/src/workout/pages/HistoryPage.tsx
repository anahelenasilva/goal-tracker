import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../hooks';
import type { Exercise, ExerciseHistoryEntry, WorkoutSession, WorkoutSet } from '../types';

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

function ExerciseHistoryCard({
  entry,
  onClick,
}: {
  entry: ExerciseHistoryEntry;
  onClick: () => void;
}) {
  const maxWeight = Math.max(...entry.sets.map(s => s.weight));
  const totalVolume = entry.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-gray-700 bg-gray-900 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">{entry.exercise.name}</span>
        <span className="text-sm text-gray-400">
          {new Date(entry.sessionStartedAt).toLocaleDateString()}
        </span>
      </div>
      <div className="text-sm text-gray-300">
        {entry.sets.length} sets · Max {maxWeight}kg · {totalVolume.toLocaleString()} volume
      </div>
    </button>
  );
}

function ExerciseHistoryDetail({
  entry,
  onBack,
}: {
  entry: ExerciseHistoryEntry;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
      >
        ← Back to Exercise History
      </button>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-1">{entry.exercise.name}</h2>
        <p className="text-gray-400 text-sm">{formatDateTime(entry.sessionStartedAt)}</p>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <h3 className="font-semibold text-white">Sets ({entry.sets.length})</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {entry.sets.map((set, index) => (
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
    </div>
  );
}

type ViewMode = 'sessions' | 'exercises';

export function HistoryPage() {
  const { sessions, sets, exercises, history } = useWorkoutProviders();
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]);
  const [sessionSets, setSessionSets] = useState<Record<string, WorkoutSet[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('sessions');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ExerciseHistoryEntry | null>(null);
  const [exerciseFilter, setExerciseFilter] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const [sessionsData, exercisesData] = await Promise.all([
        sessions.getAll(),
        exercises.getAll(),
      ]);
      const completedSessions = sessionsData.filter(
        s => s.status === 'completed' || s.status === 'abandoned'
      );

      if (cancelled) return;

      setAllSessions(completedSessions);
      setAllExercises(exercisesData);

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
  }, [sessions, sets, exercises]);

  useEffect(() => {
    if (selectedExercise) {
      history.getExerciseHistory(selectedExercise.id).then(setExerciseHistory);
    }
  }, [selectedExercise, history]);

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

  if (selectedEntry) {
    return (
      <div className="space-y-6">
        <ExerciseHistoryDetail
          entry={selectedEntry}
          onBack={() => setSelectedEntry(null)}
        />
      </div>
    );
  }

  if (selectedExercise) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedExercise(null)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          ← Back to Exercises
        </button>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-1">{selectedExercise.name}</h2>
          <p className="text-gray-400">
            {exerciseHistory.length} {exerciseHistory.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>

        {exerciseHistory.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
            <div className="text-gray-400">
              No history for this exercise yet.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {exerciseHistory.map(entry => (
              <ExerciseHistoryCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseFilter.toLowerCase())
  );

  const exercisesWithHistory = filteredExercises.filter(exercise =>
    Object.values(sessionSets).some(sets =>
      sets.some(s => s.exerciseId === exercise.id)
    )
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">Workout History</h2>
        <p className="text-gray-400 mb-4">
          {allSessions.length} completed {allSessions.length === 1 ? 'session' : 'sessions'}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('sessions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'sessions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            By Session
          </button>
          <button
            onClick={() => setViewMode('exercises')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'exercises'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            By Exercise
          </button>
        </div>
      </div>

      {viewMode === 'sessions' && (
        allSessions.length === 0 ? (
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
        )
      )}

      {viewMode === 'exercises' && (
        <>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <input
              type="text"
              placeholder="Filter exercises..."
              value={exerciseFilter}
              onChange={e => setExerciseFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {exercisesWithHistory.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
              <div className="text-gray-400">
                {exerciseFilter
                  ? 'No exercises match your filter.'
                  : 'No exercises with history yet. Start logging sets to see exercise history.'}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {exercisesWithHistory.map(exercise => {
                const exerciseSessions = Object.values(sessionSets).filter(sets =>
                  sets.some(s => s.exerciseId === exercise.id)
                ).length;

                return (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise)}
                    className="text-left p-4 rounded-lg border border-gray-700 bg-gray-900 hover:border-gray-600 transition-colors"
                  >
                    <div className="text-white font-medium mb-1">{exercise.name}</div>
                    <div className="text-sm text-gray-400">
                      {exerciseSessions} {exerciseSessions === 1 ? 'session' : 'sessions'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}