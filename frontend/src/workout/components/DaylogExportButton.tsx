import { useEffect, useMemo, useState } from 'react';
import type { GoalEntry } from '../../services/api';
import type { WorkoutSet } from '../types';
import { generateDaylogCommands, generateTreadmillDaylogCommand } from '../utils';

type CopyState = 'idle' | 'copied' | 'error';

type WorkoutExportProps = {
  sets: WorkoutSet[];
  treadmillEntry?: never;
};

type TreadmillExportProps = {
  treadmillEntry: GoalEntry;
  sets?: never;
};

type DaylogExportButtonProps = WorkoutExportProps | TreadmillExportProps;

export function DaylogExportButton(props: DaylogExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const { sets, treadmillEntry } = props;

  const commands = useMemo(() => {
    if (sets !== undefined) {
      return generateDaylogCommands(sets);
    }

    return generateTreadmillDaylogCommand(treadmillEntry!);
  }, [sets, treadmillEntry]);

  useEffect(() => {
    if (copyState !== 'copied') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!commands) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
      >
        Daylog
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daylog-export-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="daylog-export-title" className="text-xl font-bold text-white">
                Daylog commands
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close dialog"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <pre
              className="bg-gray-950 text-gray-100 border border-gray-800 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap break-all"
              style={{ userSelect: 'all' }}
            >
              {commands}
            </pre>

            <div className="mt-4 flex items-center justify-end gap-2">
              {copyState !== 'error' ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {copyState === 'copied' ? 'Copied!' : 'Copy'}
                </button>
              ) : (
                <span className="text-sm text-amber-300">
                  Clipboard unavailable - click text to select
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
