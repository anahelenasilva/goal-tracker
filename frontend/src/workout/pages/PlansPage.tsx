import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../context';
import type { TrainingPlan } from '../types';

export function PlansPage() {
  const { plans, exercises } = useWorkoutProviders();
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      const allPlans = await plans.getAll();
      setTrainingPlans(allPlans);
      setLoading(false);
    };
    loadPlans();
  }, [plans]);

  const getExerciseNames = async (exerciseIds: string[]) => {
    const names: string[] = [];
    for (const id of exerciseIds) {
      const exercise = await exercises.getById(id);
      if (exercise) names.push(exercise.name);
    }
    return names;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-300">Loading...</div>
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
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            New Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainingPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onGetNames={getExerciseNames} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  onGetNames,
}: {
  plan: TrainingPlan;
  onGetNames: (ids: string[]) => Promise<string[]>;
}) {
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);

  useEffect(() => {
    onGetNames(plan.exerciseIds).then(setExerciseNames);
  }, [plan.exerciseIds, onGetNames]);

  return (
    <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 hover:border-gray-700 transition-colors">
      <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
      {plan.description && (
        <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
      )}
      <div className="text-sm text-gray-500">
        {exerciseNames.length} exercises
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
