import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../hooks';
import type { TrainingPlan } from '../types';
import { getExerciseDisplayName } from '../utils';

interface PlanSelectionPanelProps {
  onStartWithPlan: (planId: string) => void;
  onStartWithoutPlan: () => void;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getCurrentDayName(): string {
  return DAY_NAMES[new Date().getDay()];
}

export function PlanSelectionPanel({ onStartWithPlan, onStartWithoutPlan }: PlanSelectionPanelProps) {
  const { plans, exercises: exerciseProvider } = useWorkoutProviders();
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [exerciseDisplayNames, setExerciseDisplayNames] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const currentDay = getCurrentDayName();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allPlans = await plans.getAll();
      setTrainingPlans(allPlans);

      const namesMap: Record<string, string[]> = {};
      for (const plan of allPlans) {
        const names: string[] = [];
        for (const id of plan.exerciseIds) {
          const exercise = await exerciseProvider.getById(id);
          if (exercise) names.push(getExerciseDisplayName(exercise));
        }
        namesMap[plan.id] = names;
      }
      setExerciseDisplayNames(namesMap);
      setLoading(false);
    };
    load();
  }, [plans, exerciseProvider]);

  const isTodaysPlan = (plan: TrainingPlan) =>
    plan.assignedDays?.some((d) => d.toLowerCase() === currentDay) ?? false;

  const todaysPlans = trainingPlans.filter(isTodaysPlan);
  const otherPlans = trainingPlans.filter((p) => !isTodaysPlan(p));

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="text-gray-400">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todaysPlans.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-blue-800/50">
          <h3 className="text-lg font-semibold text-white mb-1">Today's Plans</h3>
          <p className="text-sm text-blue-400 mb-4 capitalize">
            {currentDay} - {todaysPlans.length} {todaysPlans.length === 1 ? 'plan' : 'plans'} scheduled
          </p>
          <div className="space-y-3">
            {todaysPlans.map((plan) => (
              <PlanOptionCard
                key={plan.id}
                plan={plan}
                exerciseNames={exerciseDisplayNames[plan.id] || []}
                highlighted
                onSelect={() => onStartWithPlan(plan.id)}
              />
            ))}
          </div>
        </div>
      )}

      {otherPlans.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            {todaysPlans.length > 0 ? 'Other Plans' : 'Start from Plan'}
          </h3>
          <div className="space-y-3">
            {otherPlans.map((plan) => (
              <PlanOptionCard
                key={plan.id}
                plan={plan}
                exerciseNames={exerciseDisplayNames[plan.id] || []}
                onSelect={() => onStartWithPlan(plan.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onStartWithoutPlan}
        className="w-full px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium text-lg transition-colors border border-gray-700"
      >
        Start Blank Workout
      </button>
    </div>
  );
}

interface PlanOptionCardProps {
  plan: TrainingPlan;
  exerciseNames: string[];
  highlighted?: boolean;
  onSelect: () => void;
}

function PlanOptionCard({ plan, exerciseNames, highlighted, onSelect }: PlanOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg transition-colors ${
        highlighted
          ? 'bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/50'
          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-white">{plan.name}</h4>
        {highlighted && (
          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            Today
          </span>
        )}
      </div>
      {plan.description && (
        <p className="text-sm text-gray-400 mb-2">{plan.description}</p>
      )}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">{exerciseNames.length} exercises</span>
        {plan.assignedDays && plan.assignedDays.length > 0 && (
          <>
            <span className="text-gray-700">|</span>
            <div className="flex gap-1">
              {plan.assignedDays.map((day) => (
                <span
                  key={day}
                  className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs capitalize"
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      {exerciseNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {exerciseNames.slice(0, 4).map((name) => (
            <span key={name} className="px-2 py-0.5 bg-gray-900/50 rounded text-xs text-gray-400">
              {name}
            </span>
          ))}
          {exerciseNames.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">+{exerciseNames.length - 4} more</span>
          )}
        </div>
      )}
    </button>
  );
}
