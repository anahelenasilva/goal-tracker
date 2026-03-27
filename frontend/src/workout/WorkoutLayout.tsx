import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';

export function WorkoutLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <div className="hidden md:flex items-center gap-1">
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
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              <NavLink to="/workout" end className={linkClasses} onClick={() => setMobileMenuOpen(false)}>
                Session
              </NavLink>
              <NavLink to="/workout/history" className={linkClasses} onClick={() => setMobileMenuOpen(false)}>
                History
              </NavLink>
              <NavLink to="/workout/plans" className={linkClasses} onClick={() => setMobileMenuOpen(false)}>
                Plans
              </NavLink>
              <NavLink to="/workout/exercises" className={linkClasses} onClick={() => setMobileMenuOpen(false)}>
                Exercises
              </NavLink>
              <NavLink to="/workout/graphs" className={linkClasses} onClick={() => setMobileMenuOpen(false)}>
                Graphs
              </NavLink>
              <NavLink to="/workout/timer" className={linkClasses} onClick={() => setMobileMenuOpen(false)}>
                Timer
              </NavLink>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
