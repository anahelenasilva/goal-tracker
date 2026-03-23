import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutProviders } from '../hooks';
import type { TrainingPlan } from '../types';
import { DeletePlanDialog, PlanFormModal } from '../components/PlanFormModal';

export function PlansPage() {
  const navigate = useNavigate();
  const { plans, exercises } = useWorkoutProviders();
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingPlan, setDeletingPlan] = useState<TrainingPlan | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allPlans = await plans.getAll();
      setTrainingPlans(allPlans);
    } catch {
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [plans]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreate = async (data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt' | 'exerciseIds'>) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const newPlan = await plans.create({
        ...data,
        exerciseIds: [],
      });
      setShowCreateModal(false);
      navigate(`/workout/plans/${newPlan.id}`);
    } catch {
      setCreateError('Failed to create plan. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = (plan: TrainingPlan) => {
    setEditingPlan(plan);
    setEditError(null);
  };

  const handleEditSubmit = async (data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt' | 'exerciseIds'>) => {
    if (!editingPlan) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await plans.update(editingPlan.id, data);
      setEditingPlan(null);
      await loadPlans();
    } catch {
      setEditError('Failed to update plan. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (plan: TrainingPlan) => {
    setDeletingPlan(plan);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await plans.delete(deletingPlan.id);
      setDeletingPlan(null);
      await loadPlans();
    } catch {
      setDeleteError('Failed to delete plan. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadPlans}
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Training Plans</h2>
            <p className="text-gray-400">
              Create and manage your workout routines.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            New Plan
          </button>
        </div>
      </div>

      {trainingPlans.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
          <div className="text-gray-400 mb-4">
            No training plans yet. Create your first plan to get started.
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onGetNames={async (ids) => {
                const names: string[] = [];
                for (const id of ids) {
                  const exercise = await exercises.getById(id);
                  if (exercise) names.push(exercise.name);
                }
                return names;
              }}
              onClick={() => navigate(`/workout/plans/${plan.id}`)}
              onEdit={() => handleEdit(plan)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <PlanFormModal
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          loading={createLoading}
          error={createError}
        />
      )}

      {editingPlan && (
        <PlanFormModal
          plan={editingPlan}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingPlan(null)}
          loading={editLoading}
          error={editError}
        />
      )}

      {deletingPlan && (
        <DeletePlanDialog
          planName={deletingPlan.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingPlan(null)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: TrainingPlan;
  onGetNames: (ids: string[]) => Promise<string[]>;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PlanCard({ plan, onGetNames, onClick, onEdit, onDelete }: PlanCardProps) {
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);

  useEffect(() => {
    onGetNames(plan.exerciseIds).then(setExerciseNames);
  }, [plan.exerciseIds, onGetNames]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 rounded-lg p-5 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {plan.description && (
        <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
      )}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">
          {exerciseNames.length} exercises
        </span>
        {plan.assignedDays && plan.assignedDays.length > 0 && (
          <>
            <span className="text-gray-700">|</span>
            <div className="flex gap-1">
              {plan.assignedDays.map((day) => (
                <span
                  key={day}
                  className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs capitalize"
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {exerciseNames.slice(0, 3).map((name) => (
          <span
            key={name}
            className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
          >
            {name}
          </span>
        ))}
        {exerciseNames.length > 3 && (
          <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
            +{exerciseNames.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}