import { useEffect, useState } from 'react';
import { useWorkoutProviders } from '../hooks';
import type { Exercise, ExerciseProgressPoint } from '../types';

type Metric = 'weight' | 'reps' | 'volume';
type Period = '7' | '30' | '90' | '365';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
  { value: '365', label: 'All Time' },
];

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'weight', label: 'Max Weight' },
  { value: 'reps', label: 'Max Reps' },
  { value: 'volume', label: 'Total Volume' },
];

function LineChart({
  data,
  metric,
  height = 200,
}: {
  data: ExerciseProgressPoint[];
  metric: Metric;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="bg-gray-800 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-gray-500">No data available</span>
      </div>
    );
  }

  const values = data.map(d => d[metric]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - ((d[metric] - minVal) / range) * chartHeight,
    date: d.date,
    value: d[metric],
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const yTicks = 4;
  const xTicks = Math.min(data.length, 5);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" style={{ height }}>
      <rect x={0} y={0} width={width} height={height} fill="#1f2937" rx={8} />

      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padding.top + (i / yTicks) * chartHeight;
        const val = maxVal - (i / yTicks) * range;
        return (
          <g key={`y-${i}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#374151"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fill="#9ca3af"
              fontSize={11}
            >
              {metric === 'volume' ? val.toLocaleString() : val.toFixed(1)}
            </text>
          </g>
        );
      })}

      {Array.from({ length: xTicks }).map((_, i) => {
        const dataIndex = Math.floor((i / (xTicks - 1)) * (data.length - 1));
        const x = padding.left + (dataIndex / Math.max(data.length - 1, 1)) * chartWidth;
        const date = new Date(data[dataIndex]?.date);
        return (
          <g key={`x-${i}`}>
            <text
              x={x}
              y={height - 10}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize={11}
            >
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        );
      })}

      <path
        d={pathD}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#3b82f6"
          stroke="#1f2937"
          strokeWidth={2}
          className="hover:r-6 transition-all cursor-pointer"
        >
          <title>
            {new Date(p.date).toLocaleDateString()}: {metric === 'volume' ? p.value.toLocaleString() : p.value}
          </title>
        </circle>
      ))}
    </svg>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white text-xl font-semibold">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-gray-400 text-sm ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function GraphsPage() {
  const { exercises, graphs } = useWorkoutProviders();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [progressData, setProgressData] = useState<ExerciseProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('90');
  const [metric, setMetric] = useState<Metric>('weight');
  const [exerciseFilter, setExerciseFilter] = useState('');

  useEffect(() => {
    exercises.getAll().then(data => {
      setAllExercises(data);
      setLoading(false);
    });
  }, [exercises]);

  useEffect(() => {
    if (selectedExercise) {
      graphs.getExerciseProgress(selectedExercise.id, { period }).then(data => {
        setProgressData(data);
      });
    }
  }, [selectedExercise, period, graphs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2">Progress Graphs</h2>
        </div>
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </div>
    );
  }

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseFilter.toLowerCase())
  );

  const stats = progressData.length > 0
    ? {
        sessions: progressData.length,
        maxWeight: Math.max(...progressData.map(d => d.weight)),
        maxReps: Math.max(...progressData.map(d => d.reps)),
        totalVolume: progressData.reduce((sum, d) => sum + d.volume, 0),
        avgWeight: progressData.reduce((sum, d) => sum + d.weight, 0) / progressData.length,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">Progress Graphs</h2>
        <p className="text-gray-400">
          Track your exercise progression over time.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <input
          type="text"
          placeholder="Search exercises..."
          value={exerciseFilter}
          onChange={e => setExerciseFilter(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {filteredExercises.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
          <div className="text-gray-400">
            No exercises found. Add exercises to start tracking progress.
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selectedExercise?.id === exercise.id
                  ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'
              }`}
            >
              <div className="font-medium">{exercise.name}</div>
              <div className="text-sm text-gray-500 capitalize">{exercise.category}</div>
            </button>
          ))}
        </div>
      )}

      {selectedExercise && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Period:</span>
                <div className="flex gap-1">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPeriod(opt.value)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        period === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Metric:</span>
                <div className="flex gap-1">
                  {METRIC_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMetric(opt.value)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        metric === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-64 bg-gray-800 rounded-lg overflow-hidden">
              <LineChart data={progressData} metric={metric} height={256} />
            </div>
          </div>

          {stats && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Sessions" value={stats.sessions} />
              <StatCard label="Max Weight" value={stats.maxWeight} unit="kg" />
              <StatCard label="Max Reps" value={stats.maxReps} />
              <StatCard label="Total Volume" value={stats.totalVolume.toLocaleString()} unit="kg" />
            </div>
          )}

          {progressData.length === 0 && (
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
              <div className="text-gray-400">
                No data for this exercise in the selected period.
                Complete workouts with this exercise to see progress.
              </div>
            </div>
          )}

          {progressData.length > 0 && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
                <h3 className="font-semibold text-white">Session History</h3>
              </div>
              <div className="divide-y divide-gray-800">
                {progressData.slice().reverse().map((point, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="text-gray-300">
                      {new Date(point.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">
                        <span className="text-white">{point.weight}</span> kg
                      </span>
                      <span className="text-gray-400">
                        <span className="text-white">{point.reps}</span> reps
                      </span>
                      <span className="text-gray-400">
                        <span className="text-white">{point.volume.toLocaleString()}</span> vol
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}