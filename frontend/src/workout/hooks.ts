import { useContext } from 'react';
import { WorkoutProvidersContext } from './provider-context';
import type { WorkoutProviders } from './providers';

export function useWorkoutProviders(): WorkoutProviders {
  const context = useContext(WorkoutProvidersContext);
  if (!context) {
    throw new Error('useWorkoutProviders must be used within WorkoutProvidersProvider');
  }
  return context;
}