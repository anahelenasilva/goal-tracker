import { useEffect, useRef, useState } from 'react';
import { useWorkoutProviders } from '../hooks';
import type { Exercise } from '../types';
import { getExerciseDisplayName, getExerciseEnglishName } from '../utils';

interface ExercisePickerProps {
  value: Exercise | null;
  onChange: (exercise: Exercise) => void;
  placeholder?: string;
  allowedExerciseIds?: string[];
}

export function ExercisePicker({ value, onChange, placeholder = 'Select exercise...', allowedExerciseIds }: ExercisePickerProps) {
  const { exercises } = useWorkoutProviders();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = 'exercise-list';

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

  const baseExercises = allowedExerciseIds
    ? allExercises.filter((e) => allowedExerciseIds.includes(e.id))
    : allExercises;

  const filteredExercises = query
    ? baseExercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.namePt?.toLowerCase().includes(query.toLowerCase())
      )
    : baseExercises;

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
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const flatExercises = Object.values(groupedExercises).flat();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, flatExercises.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatExercises[highlightedIndex]) {
          handleSelect(flatExercises[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const flatExercisesList = Object.values(groupedExercises).flat();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-left text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
      >
        {value ? (
          <div className="flex items-center justify-between">
            <div>
              <span>{getExerciseDisplayName(value)}</span>
              {getExerciseEnglishName(value) && <span className="text-xs text-gray-500 ml-2">{getExerciseEnglishName(value)}</span>}
            </div>
            <span className="text-sm text-gray-400 capitalize">{value.category}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-auto"
        >
          <div className="p-2 border-b border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search exercises..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Search exercises"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-400" role="status">Loading...</div>
          ) : filteredExercises.length === 0 ? (
            <div className="p-4 text-center text-gray-400" role="status">No exercises found</div>
          ) : (
            <div className="py-1">
              {Object.entries(groupedExercises).map(([category, exercises]) => (
                <div key={category}>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-900">
                    {category}
                  </div>
                  {exercises.map((exercise) => {
                    const globalIndex = flatExercisesList.indexOf(exercise);
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleSelect(exercise)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-700"
                        role="option"
                        aria-selected={value?.id === exercise.id}
                        id={`exercise-option-${exercise.id}`}
                      >
                        <div>{getExerciseDisplayName(exercise)}</div>
                        {getExerciseEnglishName(exercise) && <div className="text-xs text-gray-500">{getExerciseEnglishName(exercise)}</div>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}