import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../context';
import type { Exercise } from '../types';

export function ExercisesPage() {
  const { exercises } = useWorkoutProviders();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      const data = await exercises.getAll();
      setAllExercises(data);
      setLoading(false);
    };
    loadExercises();
  }, [exercises]);

  const filteredExercises = searchQuery
    ? allExercises.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allExercises;

  const builtIn = filteredExercises.filter((e) => !e.isCustom);
  const custom = filteredExercises.filter((e) => e.isCustom);

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Exercise Library</h2>
            <p className="text-gray-400">
              Browse and manage your exercise database.
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
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

      <div className="space-y-6">
        {custom.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Custom Exercises</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {custom.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Built-in Exercises</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {builtIn.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
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
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">{exercise.name}</span>
        <span
          className={`px-2 py-1 rounded text-xs ${categoryColors[exercise.category] || categoryColors.other}`}
        >
          {exercise.category}
        </span>
      </div>
    </div>
  );
}
