import { NavLink, Outlet } from 'react-router-dom';

export function WorkoutLayout() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <NavLink to="/" className="text-gray-400 hover:text-white text-sm">
                ← Dashboard
              </NavLink>
              <span className="text-gray-700">|</span>
              <span className="text-white font-semibold">Workout</span>
            </div>
            <div className="flex items-center gap-1">
              <NavLink to="/workout" end className={linkClasses}>
                Session
              </NavLink>
              <NavLink to="/workout/history" className={linkClasses}>
                History
              </NavLink>
              <NavLink to="/workout/plans" className={linkClasses}>
                Plans
              </NavLink>
              <NavLink to="/workout/exercises" className={linkClasses}>
                Exercises
              </NavLink>
              <NavLink to="/workout/graphs" className={linkClasses}>
                Graphs
              </NavLink>
              <NavLink to="/workout/timer" className={linkClasses}>
                Timer
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
