import { createContext, useContext, type ReactNode } from 'react';
import type { WorkoutProviders } from './providers';

const WorkoutProvidersContext = createContext<WorkoutProviders | null>(null);

export function WorkoutProvidersProvider({
  providers,
  children,
}: {
  providers: WorkoutProviders;
  children: ReactNode;
}) {
  return (
    <WorkoutProvidersContext.Provider value={providers}>
      {children}
    </WorkoutProvidersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkoutProviders(): WorkoutProviders {
  const context = useContext(WorkoutProvidersContext);
  if (!context) {
    throw new Error('useWorkoutProviders must be used within WorkoutProvidersProvider');
  }
  return context;
}
