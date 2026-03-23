import { useEffect, useRef, useState } from 'react';

export function TimerPage() {
  const [duration, setDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (timeLeft > 0) setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const presetDurations = [60, 90, 120, 180, 300];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">Rest Timer</h2>
        <p className="text-gray-400">
          Set your rest period between sets.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="text-center">
          <div className="text-7xl font-mono font-bold text-white mb-8">
            {formatTime(timeLeft)}
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={timeLeft === 0}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium text-lg transition-colors"
              >
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-lg transition-colors"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-lg transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-gray-400 text-sm">Quick Set</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {presetDurations.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDurationChange(d)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${duration === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {formatTime(d)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
