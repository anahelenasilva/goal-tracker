import { useState } from 'react';
import type { Exercise, WeightUnit, WorkoutSet } from '../types';
import { ExercisePicker } from './ExercisePicker';

interface SetLoggingFormProps {
  onSubmit: (data: {
    exerciseId: string;
    reps: number;
    weight: number | null;
    weightUnit: WeightUnit;
    notes?: string;
  }) => Promise<void>;
  lastSet?: WorkoutSet | null;
  allowedExerciseIds?: string[];
}

export function SetLoggingForm({ onSubmit, lastSet, allowedExerciseIds }: SetLoggingFormProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState<string>(lastSet?.reps.toString() || '');
  const [weight, setWeight] = useState<string>(
    lastSet?.weight != null ? lastSet.weight.toString() : '',
  );
  const [unit, setUnit] = useState<WeightUnit>(lastSet?.weightUnit || 'kg');
  const [notes, setNotes] = useState<string>(lastSet?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedExercise) {
      setError('Please select an exercise');
      return;
    }

    const repsNum = parseFloat(reps);

    if (!reps || isNaN(repsNum) || repsNum <= 0) {
      setError('Please enter valid reps');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        exerciseId: selectedExercise.id,
        reps: repsNum,
        weight: weight.trim() === '' ? null : parseFloat(weight),
        weightUnit: unit,
        notes: notes.trim() || undefined,
      });
      setReps('');
      setWeight('');
      setNotes('');
      setSelectedExercise(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log set');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    if (lastSet) {
      setReps(lastSet.reps.toString());
      setWeight(lastSet.weight != null ? lastSet.weight.toString() : '');
      setUnit(lastSet.weightUnit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Exercise</label>
        <ExercisePicker
          value={selectedExercise}
          onChange={setSelectedExercise}
          placeholder="Select an exercise..."
          allowedExerciseIds={allowedExerciseIds}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Reps</label>
          <input
            type="number"
            inputMode="decimal"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="10"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Weight</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="100"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as WeightUnit)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div
          id="set-form-error"
          className="px-3 py-2 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Logging...' : 'Log Set'}
        </button>

        {lastSet && (
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
          >
            Same as Last
          </button>
        )}
      </div>
    </form>
  );
}