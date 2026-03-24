import type { WorkoutSet } from '../types';

interface SetListProps {
  sets: WorkoutSet[];
  onDelete?: (setId: string) => void;
}

export function SetList({ sets, onDelete }: SetListProps) {
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
    const exercise = sets.find((s) => s.exercise?.id === exerciseId)?.exercise;
    return exercise?.name || 'Unknown Exercise';
  };

  if (sets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No sets logged yet. Start logging your workout!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByExercise).map(([exerciseId, exerciseSets]) => (
        <div key={exerciseId} className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
            <h3 className="font-semibold text-white">
              {getExerciseName(exerciseId)}
            </h3>
          </div>
          <div className="divide-y divide-gray-700">
            {exerciseSets.map((set, index) => (
              <div
                key={set.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-750"
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-medium">#{index + 1}</span>
                  <span className="text-white">
                    {set.reps} reps @ {set.weight}{set.weightUnit}
                  </span>
                  {set.notes && (
                    <span className="text-gray-400 text-sm truncate max-w-32">
                      {set.notes}
                    </span>
                  )}
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(set.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    aria-label="Delete set"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}