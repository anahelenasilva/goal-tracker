import { useCallback, useEffect, useState } from 'react';
import { useWorkoutProviders } from '../hooks';
import type { Exercise } from '../types';
import { getExerciseDisplayName } from '../utils';
import { DeleteConfirmationDialog, ExerciseFormModal } from '../components/ExerciseFormModal';

export function ExercisesPage() {
  const { exercises } = useWorkoutProviders();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exercises.getAll();
      setAllExercises(data);
    } catch {
      setError('Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [exercises]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const filteredExercises = searchQuery
    ? allExercises.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.namePt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allExercises;

  const builtIn = filteredExercises.filter((e) => !e.isCustom);
  const custom = filteredExercises.filter((e) => e.isCustom);

  const handleCreate = () => {
    setEditingExercise(null);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleDelete = (exercise: Exercise) => {
    setDeletingExercise(exercise);
    setDeleteError(null);
  };

  const handleFormSubmit = async (data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingExercise) {
        await exercises.update(editingExercise.id, data);
      } else {
        await exercises.create(data);
      }
      setShowFormModal(false);
      await loadExercises();
    } catch {
      setFormError('Failed to save exercise. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExercise) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await exercises.delete(deletingExercise.id);
      setDeletingExercise(null);
      await loadExercises();
    } catch {
      setDeleteError('Failed to delete exercise. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-300">Loading exercises...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadExercises}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Exercise Library</h2>
            <p className="text-gray-400">
              Browse and manage your exercise database.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Exercise
          </button>
        </div>
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredExercises.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
          <div className="text-gray-400 mb-4">
            {searchQuery ? 'No exercises match your search.' : 'No exercises found.'}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {custom.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Custom Exercises</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {custom.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Built-in Exercises</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {builtIn.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <ExerciseFormModal
          exercise={editingExercise}
          onSubmit={handleFormSubmit}
          onClose={() => setShowFormModal(false)}
          loading={formLoading}
          error={formError}
        />
      )}

      {deletingExercise && (
        <DeleteConfirmationDialog
          exerciseName={deletingExercise.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingExercise(null)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const categoryColors: Record<string, string> = {
    chest: 'bg-red-900/50 text-red-300',
    back: 'bg-blue-900/50 text-blue-300',
    shoulders: 'bg-purple-900/50 text-purple-300',
    biceps: 'bg-orange-900/50 text-orange-300',
    triceps: 'bg-yellow-900/50 text-yellow-300',
    legs: 'bg-green-900/50 text-green-300',
    core: 'bg-pink-900/50 text-pink-300',
    cardio: 'bg-cyan-900/50 text-cyan-300',
    full_body: 'bg-indigo-900/50 text-indigo-300',
    other: 'bg-gray-800 text-gray-300',
  };

  const formatCategory = (cat: string) =>
    cat.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{getExerciseDisplayName(exercise)}</span>
          {exercise.isCustom && (
            <span className="px-2 py-0.5 text-xs bg-blue-900/50 text-blue-300 rounded">
              Custom
            </span>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs ${categoryColors[exercise.category] || categoryColors.other}`}
        >
          {formatCategory(exercise.category)}
        </span>
      </div>

      {exercise.isCustom && (
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(exercise)}
            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(exercise)}
            className="px-3 py-1 text-sm bg-red-900/50 hover:bg-red-900 text-red-300 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}