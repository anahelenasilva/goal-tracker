import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkoutProviders } from '../hooks';
import type { Exercise, TrainingPlan } from '../types';
import { getExerciseDisplayName } from '../utils';
import { DeletePlanDialog, PlanFormModal } from '../components/PlanFormModal';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plans, exercises } = useWorkoutProviders();

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [planExercises, setPlanExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addExerciseLoading, setAddExerciseLoading] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const planData = await plans.getById(planId);
      if (!planData) {
        setError('Plan not found');
        return;
      }
      setPlan(planData);
      const exercisePromises = planData.exerciseIds.map((id) => exercises.getById(id));
      const exerciseResults = await Promise.all(exercisePromises);
      setPlanExercises(exerciseResults.filter((e): e is Exercise => e !== null));
    } catch {
      setError('Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [planId, plans, exercises]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleEditSubmit = async (data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt' | 'exerciseIds'>) => {
    if (!plan) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await plans.update(plan.id, data);
      setPlan(updated);
      setShowEditModal(false);
    } catch {
      setEditError('Failed to update plan');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await plans.delete(plan.id);
      navigate('/workout/plans');
    } catch {
      setDeleteError('Failed to delete plan');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!plan) return;
    setAddExerciseLoading(true);
    try {
      const updated = await plans.addExercise(plan.id, exercise.id);
      setPlan(updated);
      setPlanExercises((prev) => [...prev, exercise]);
      setShowAddExercise(false);
    } catch {
      setError('Failed to add exercise');
    } finally {
      setAddExerciseLoading(false);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!plan) return;
    try {
      const updated = await plans.removeExercise(plan.id, exerciseId);
      setPlan(updated);
      setPlanExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    } catch {
      setError('Failed to remove exercise');
    }
  };

  const handleMoveExercise = async (fromIndex: number, toIndex: number) => {
    if (!plan || fromIndex === toIndex) return;
    const newOrder = [...planExercises];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setPlanExercises(newOrder);
    try {
      const updated = await plans.reorderExercises(plan.id, newOrder.map((e) => e.id));
      setPlan(updated);
    } catch {
      loadPlan();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-300 mb-4">{error || 'Plan not found'}</p>
          <button
            onClick={() => navigate('/workout/plans')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Back to Plans
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
            <button
              onClick={() => navigate('/workout/plans')}
              className="text-gray-400 hover:text-white text-sm mb-2 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Plans
            </button>
            <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
            {plan.description && (
              <p className="text-gray-400 mt-1">{plan.description}</p>
            )}
            {plan.assignedDays && plan.assignedDays.length > 0 && (
              <div className="flex gap-1 mt-2">
                {plan.assignedDays.map((day) => (
                  <span
                    key={day}
                    className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs capitalize"
                  >
                    {day.slice(0, 3)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Exercises ({planExercises.length})
          </h3>
          <button
            onClick={() => setShowAddExercise(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add Exercise
          </button>
        </div>

        {planExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No exercises added yet. Click "Add Exercise" to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {planExercises.map((exercise, index) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={index}
                total={planExercises.length}
                onRemove={() => handleRemoveExercise(exercise.id)}
                onMoveUp={() => handleMoveExercise(index, index - 1)}
                onMoveDown={() => handleMoveExercise(index, index + 1)}
              />
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <PlanFormModal
          plan={plan}
          onSubmit={handleEditSubmit}
          onClose={() => setShowEditModal(false)}
          loading={editLoading}
          error={editError}
        />
      )}

      {showDeleteDialog && (
        <DeletePlanDialog
          planName={plan.name}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteDialog(false)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      {showAddExercise && (
        <AddExerciseModal
          existingIds={planExercises.map((e) => e.id)}
          onSelect={handleAddExercise}
          onClose={() => setShowAddExercise(false)}
          loading={addExerciseLoading}
        />
      )}
    </div>
  );
}

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ExerciseRow({ exercise, index, total, onRemove, onMoveUp, onMoveDown }: ExerciseRowProps) {
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

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg group">
      <span className="text-gray-500 text-sm w-6">{index + 1}</span>
      <div className="flex-1">
        <span className="text-white">{getExerciseDisplayName(exercise)}</span>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs ${categoryColors[exercise.category] || categoryColors.other}`}
      >
        {exercise.category}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-300"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface AddExerciseModalProps {
  existingIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  loading?: boolean;
}

function AddExerciseModal({ existingIds, onSelect, onClose, loading }: AddExerciseModalProps) {
  const { exercises } = useWorkoutProviders();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [modalLoading, setModalLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setModalLoading(true);
      const data = await exercises.getAll();
      setAllExercises(data);
      setModalLoading(false);
    };
    load();
  }, [exercises]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const availableExercises = allExercises.filter((e) => !existingIds.includes(e.id));
  const filtered = query
    ? availableExercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase())
      )
    : availableExercises;

  const grouped = filtered.reduce(
    (acc, exercise) => {
      const cat = exercise.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(exercise);
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Add Exercise</h3>
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

        <input
          type="text"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />

        <div className="max-h-64 overflow-auto">
          {modalLoading ? (
            <div className="text-center py-4 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              {availableExercises.length === 0
                ? 'All exercises already added'
                : 'No exercises found'}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, exercises]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => onSelect(exercise)}
                        disabled={loading}
                        className="w-full px-3 py-2 text-left bg-gray-800 hover:bg-gray-700 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {getExerciseDisplayName(exercise)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}