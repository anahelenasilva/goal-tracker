import { useEffect, useRef, useState } from 'react';
import { useWorkoutProviders } from '../context';
import type { Exercise } from '../types';

interface ExercisePickerProps {
  value: Exercise | null;
  onChange: (exercise: Exercise) => void;
  placeholder?: string;
}

export function ExercisePicker({ value, onChange, placeholder = 'Select exercise...' }: ExercisePickerProps) {
  const { exercises } = useWorkoutProviders();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      const data = await exercises.getAll();
      setAllExercises(data);
      setLoading(false);
    };
    loadExercises();
  }, [exercises]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredExercises = query
    ? allExercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : allExercises;

  const groupedExercises = filteredExercises.reduce(
    (acc, exercise) => {
      const category = exercise.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(exercise);
      return acc;
    },
    {} as Record<string, Exercise[]>
  );

  const handleSelect = (exercise: Exercise) => {
    onChange(exercise);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-left text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {value ? (
          <div className="flex items-center justify-between">
            <span>{value.name}</span>
            <span className="text-sm text-gray-400 capitalize">{value.category}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-auto">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : filteredExercises.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No exercises found</div>
          ) : (
            <div className="py-1">
              {Object.entries(groupedExercises).map(([category, exercises]) => (
                <div key={category}>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-900">
                    {category}
                  </div>
                  {exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => handleSelect(exercise)}
                      className="w-full px-3 py-2 text-left text-white hover:bg-gray-700"
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}