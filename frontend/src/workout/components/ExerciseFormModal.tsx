import { useEffect, useState } from 'react';
import type { Exercise, ExerciseCategory } from '../types';

interface ExerciseFormModalProps {
  exercise?: Exercise | null;
  onSubmit: (data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

const CATEGORIES: ExerciseCategory[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
  'full_body',
  'other',
];

export function ExerciseFormModal({
  exercise,
  onSubmit,
  onClose,
  loading,
  error,
}: ExerciseFormModalProps) {
  const [name, setName] = useState(exercise?.name || '');
  const [category, setCategory] = useState<ExerciseCategory>(exercise?.category || 'other');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Exercise name is required');
      return;
    }

    await onSubmit({
      name: trimmedName,
      category,
      isCustom: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            {exercise ? 'Edit Exercise' : 'Add Custom Exercise'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Exercise name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {(validationError || error) && (
            <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">
              {validationError || error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : exercise ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmationDialogProps {
  exerciseName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function DeleteConfirmationDialog({
  exerciseName,
  onConfirm,
  onClose,
  loading,
  error,
}: DeleteConfirmationDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-2">Delete Exercise</h3>
        <p className="text-gray-300 mb-4">
          Are you sure you want to delete <span className="font-semibold text-white">{exerciseName}</span>? This action cannot be undone.
        </p>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}