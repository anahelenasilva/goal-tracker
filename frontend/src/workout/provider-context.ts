import { createContext } from 'react';
import type { WorkoutProviders } from './providers';

export const WorkoutProvidersContext = createContext<WorkoutProviders | null>(null);