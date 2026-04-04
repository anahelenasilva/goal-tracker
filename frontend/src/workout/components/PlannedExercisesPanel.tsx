import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../hooks';
import type { Exercise, TrainingPlan, WorkoutSet, WeightUnit } from '../types';
import { getExerciseDisplayName, getExerciseEnglishName } from '../utils';

interface PlannedExercisesPanelProps {
  plan: TrainingPlan;
  sessionSets: WorkoutSet[];
  onQuickAdd: (data: {
    exerciseId: string;
    reps: number;
    sets: number;
    weight: number | null;
    weightUnit: WeightUnit;
    notes?: string;
  }) => Promise<void>;
}

export function PlannedExercisesPanel({ plan, sessionSets, onQuickAdd }: PlannedExercisesPanelProps) {
  const { exercises: exerciseProvider } = useWorkoutProviders();
  const [planExercises, setPlanExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddExercise, setQuickAddExercise] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const ids = plan.exerciseIds ?? [];
      if (plan.exercises && plan.exercises.length > 0) {
        setPlanExercises(plan.exercises);
      } else {
        const results = await Promise.all(ids.map((id) => exerciseProvider.getById(id)));
        setPlanExercises(results.filter((e): e is Exercise => e !== null));
      }
      setLoading(false);
    };
    load();
  }, [plan, exerciseProvider]);

  const getExerciseSets = (exerciseId: string) =>
    sessionSets.filter((s) => s.exerciseId === exerciseId);

  const isExerciseStarted = (exerciseId: string) =>
    getExerciseSets(exerciseId).length > 0;

  const completedCount = planExercises.filter((e) => isExerciseStarted(e.id)).length;

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="text-gray-400">Loading plan exercises...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Planned Exercises</h3>
          <p className="text-sm text-gray-400">{plan.name}</p>
        </div>
        <div className="text-sm text-gray-400">
          {completedCount}/{planExercises.length} started
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: planExercises.length > 0 ? `${(completedCount / planExercises.length) * 100}%` : '0%' }}
        />
      </div>

      <div className="space-y-2">
        {planExercises.map((exercise, index) => {
          const sets = getExerciseSets(exercise.id);
          const started = sets.length > 0;

          return (
            <div key={exercise.id}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${started ? 'bg-green-900/20 border border-green-800/50' : 'bg-gray-800'}`}
              >
                <span className="text-gray-500 text-sm w-6">{index + 1}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${started ? 'border-green-500 bg-green-500' : 'border-gray-600'}`}>
                  {started && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`${started ? 'text-green-300' : 'text-white'}`}>
                    {getExerciseDisplayName(exercise)}
                  </span>
                  {getExerciseEnglishName(exercise) && (
                    <span className="text-xs text-gray-500 ml-2">{getExerciseEnglishName(exercise)}</span>
                  )}
                  {started && (
                    <span className="text-green-400 text-xs ml-2">
                      {sets.reduce((sum, s) => sum + s.sets, 0)} sets
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAddExercise(quickAddExercise === exercise.id ? null : exercise.id)}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  + Set
                </button>
              </div>

              {quickAddExercise === exercise.id && (
                <QuickAddForm
                  exercise={exercise}
                  lastSet={sets.length > 0 ? sets[sets.length - 1] : null}
                  onSubmit={async (data) => {
                    await onQuickAdd(data);
                    setQuickAddExercise(null);
                  }}
                  onCancel={() => setQuickAddExercise(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface QuickAddFormProps {
  exercise: Exercise;
  lastSet: WorkoutSet | null;
  onSubmit: (data: {
    exerciseId: string;
    reps: number;
    sets: number;
    weight: number | null;
    weightUnit: WeightUnit;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

function QuickAddForm({ exercise, lastSet, onSubmit, onCancel }: QuickAddFormProps) {
  const [reps, setReps] = useState(lastSet?.reps.toString() || '');
  const [sets, setSets] = useState((lastSet?.sets ?? 1).toString());
  const [weight, setWeight] = useState(
    lastSet?.weight != null ? lastSet.weight.toString() : '',
  );
  const [unit, setUnit] = useState<WeightUnit>(lastSet?.weightUnit || 'kg');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const repsNum = parseFloat(reps);
    const setsTrimmed = sets.trim();
    const setsNum = Number(setsTrimmed);
    const weightValue = weight.trim();
    const weightNum = weightValue === '' ? null : Number(weightValue);

    if (!reps || isNaN(repsNum) || repsNum <= 0) {
      setError('Please enter valid reps');
      return;
    }
    if (
      !setsTrimmed ||
      !Number.isFinite(setsNum) ||
      !Number.isInteger(setsNum) ||
      setsNum < 1
    ) {
      setError('Please enter a valid set count');
      return;
    }
    if (
      weightNum !== null &&
      (!Number.isFinite(weightNum) || weightNum < 0)
    ) {
      setError('Please enter valid weight');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        exerciseId: exercise.id,
        reps: repsNum,
        sets: setsNum,
        weight: weightNum,
        weightUnit: unit,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-1 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[4rem]">
          <label className="block text-xs text-gray-400 mb-1">Reps</label>
          <input
            type="number"
            inputMode="decimal"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="10"
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div className="w-14 shrink-0">
          <label className="block text-xs text-gray-400 mb-1">Sets</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            placeholder="1"
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[4rem]">
          <label className="block text-xs text-gray-400 mb-1">Weight</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="100"
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-16">
          <label className="block text-xs text-gray-400 mb-1">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as WeightUnit)}
            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
        >
          {submitting ? '...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
