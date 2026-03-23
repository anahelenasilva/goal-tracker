import { type ReactNode } from 'react';
import { WorkoutProvidersContext } from './provider-context';
import type { WorkoutProviders } from './providers';

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