import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import {
  createApiProviders,
  ExercisesPage,
  GraphsPage,
  HistoryPage,
  PlanDetailPage,
  PlansPage,
  TimerPage,
  WorkoutLayout,
  WorkoutProvidersProvider,
  WorkoutSessionPage,
} from './workout';

const apiProviders = createApiProviders();

function App() {
  return (
    <WorkoutProvidersProvider providers={apiProviders}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<WorkoutLayout />}>
            <Route index element={<WorkoutSessionPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="plans/:planId" element={<PlanDetailPage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="graphs" element={<GraphsPage />} />
            <Route path="graphs/:exerciseId" element={<GraphsPage />} />
            <Route path="timer" element={<TimerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkoutProvidersProvider>
  );
}

export default App;
