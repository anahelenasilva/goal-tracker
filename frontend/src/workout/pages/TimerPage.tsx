import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'workout-timer-state';

interface TimerState {
  duration: number;
  timeLeft: number;
  isRunning: boolean;
  endTime: number | null;
}

function loadState(): TimerState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as TimerState;
    if (parsed.isRunning && parsed.endTime) {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
      if (remaining <= 0) {
        return { ...parsed, timeLeft: 0, isRunning: false, endTime: null };
      }
      return { ...parsed, timeLeft: remaining };
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: TimerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 880;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  const playCompletion = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + i * 0.15;
      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }, []);

  return { playBeep, playCompletion };
}

function CircularProgress({
  progress,
  timeLeft,
  duration,
}: {
  progress: number;
  timeLeft: number;
  duration: number;
}) {
  const radius = 120;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (timeLeft <= 10) return '#ef4444';
    if (timeLeft <= 30) return '#f59e0b';
    if (progress < 0.25) return '#22c55e';
    return '#3b82f6';
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuenow={timeLeft}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-label={`Rest timer: ${formatTime(timeLeft)} remaining`}
    >
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90" aria-hidden="true">
        <circle
          stroke="#374151"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.3s ease' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={`text-5xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}
        >
          {formatTime(timeLeft)}
        </span>
        {duration !== timeLeft && (
          <span className="text-sm text-gray-500 mt-1">/ {formatTime(duration)}</span>
        )}
      </div>
    </div>
  );
}

function getInitialState(): { duration: number; timeLeft: number; isRunning: boolean; endTime: number | null } {
  const saved = loadState();
  if (saved) {
    return {
      duration: saved.duration,
      timeLeft: saved.timeLeft,
      isRunning: saved.isRunning,
      endTime: saved.endTime,
    };
  }
  return { duration: 90, timeLeft: 90, isRunning: false, endTime: null };
}

export function TimerPage() {
  const { playBeep, playCompletion } = useAudio();
  const intervalRef = useRef<number | null>(null);

  const initialState = useMemo(() => getInitialState(), []);

  const [duration, setDuration] = useState(initialState.duration);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [endTime, setEndTime] = useState(initialState.endTime);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (isRunning && endTime) {
      saveState({ duration, timeLeft, isRunning, endTime });
    } else if (!isRunning && timeLeft === duration) {
      clearState();
    } else {
      saveState({ duration, timeLeft, isRunning, endTime: null });
    }
  }, [duration, timeLeft, isRunning, endTime]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (!endTime) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining <= 10 && remaining > 0) {
        playBeep();
      }

      if (remaining <= 0) {
        setIsRunning(false);
        setTimeLeft(0);
        setEndTime(null);
        setHasCompleted(true);
        playCompletion();
        clearState();
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, endTime, playBeep, playCompletion]);

  const handleStart = () => {
    if (timeLeft > 0) {
      const newEndTime = Date.now() + timeLeft * 1000;
      setEndTime(newEndTime);
      setIsRunning(true);
      setHasCompleted(false);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setEndTime(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setEndTime(null);
    setHasCompleted(false);
    clearState();
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
    setEndTime(null);
    setHasCompleted(false);
    clearState();
  };

  const adjustTime = (seconds: number) => {
    const newTimeLeft = Math.max(1, Math.min(3600, timeLeft + seconds));
    setTimeLeft(newTimeLeft);
    if (isRunning) {
      setEndTime(Date.now() + newTimeLeft * 1000);
    }
  };

  const handleCustomDuration = () => {
    const mins = parseInt(customMinutes || '0', 10);
    const secs = parseInt(customSeconds || '0', 10);
    const total = mins * 60 + secs;
    if (total > 0 && total <= 3600) {
      handleDurationChange(total);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  };

  const presetDurations = [60, 90, 120, 180, 300];

  const progress = duration > 0 ? timeLeft / duration : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-2">Rest Timer</h2>
        <p className="text-gray-400">Set your rest period between sets.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <div className="flex flex-col items-center">
          <CircularProgress progress={progress} timeLeft={timeLeft} duration={duration} />

          {hasCompleted && (
            <div
              className="mt-4 text-green-400 font-medium animate-pulse"
              role="status"
              aria-live="polite"
            >
              Timer Complete!
            </div>
          )}

          <div className="flex justify-center gap-3 mt-8">
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

          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => adjustTime(-30)}
              disabled={timeLeft <= 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              -30s
            </button>
            <button
              onClick={() => adjustTime(-15)}
              disabled={timeLeft <= 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              -15s
            </button>
            <button
              onClick={() => adjustTime(15)}
              disabled={timeLeft >= 3600}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              +15s
            </button>
            <button
              onClick={() => adjustTime(30)}
              disabled={timeLeft >= 3600}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              +30s
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Set</h3>
        <div className="flex justify-center gap-2 flex-wrap">
          {presetDurations.map((d) => (
            <button
              key={d}
              onClick={() => handleDurationChange(d)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : duration === d && !isRunning
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {Math.floor(d / 60)}:{(d % 60).toString().padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Custom Duration</h3>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="59"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="0"
              disabled={isRunning}
              className="w-16 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center disabled:bg-gray-900 disabled:text-gray-500"
            />
            <span className="text-gray-400">min</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="59"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(e.target.value)}
              placeholder="0"
              disabled={isRunning}
              className="w-16 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center disabled:bg-gray-900 disabled:text-gray-500"
            />
            <span className="text-gray-400">sec</span>
          </div>
          <button
            onClick={handleCustomDuration}
            disabled={isRunning || (!customMinutes && !customSeconds)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            Set
          </button>
        </div>
        <p className="text-gray-500 text-sm text-center mt-2">Max 60 minutes</p>
      </div>
    </div>
  );
}