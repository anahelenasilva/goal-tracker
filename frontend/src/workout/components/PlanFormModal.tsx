import { useEffect, useState } from 'react';
import type { TrainingPlan } from '../types';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

interface PlanFormModalProps {
  plan?: TrainingPlan | null;
  onSubmit: (data: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt' | 'exerciseIds'>) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function PlanFormModal({
  plan,
  onSubmit,
  onClose,
  loading,
  error,
}: PlanFormModalProps) {
  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [assignedDays, setAssignedDays] = useState<string[]>(plan?.assignedDays || []);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const toggleDay = (day: string) => {
    setAssignedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Plan name is required');
      return;
    }

    await onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      assignedDays: assignedDays.length > 0 ? assignedDays : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
    >
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 id="plan-modal-title" className="text-xl font-bold text-white">
            {plan ? 'Edit Plan' : 'New Training Plan'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Push Day, Leg Day"
              required
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'plan-form-error' : undefined}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of this plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assigned Days (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    assignedDays.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {(validationError || error) && (
            <div
              id="plan-form-error"
              className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm"
              role="alert"
            >
              {validationError || error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : plan ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeletePlanDialogProps {
  planName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function DeletePlanDialog({
  planName,
  onConfirm,
  onClose,
  loading,
  error,
}: DeletePlanDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
    >
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-800">
        <h3 id="delete-dialog-title" className="text-xl font-bold text-white mb-2">Delete Training Plan</h3>
        <p id="delete-dialog-desc" className="text-gray-300 mb-4">
          Are you sure you want to delete <span className="font-semibold text-white">{planName}</span>? This action cannot be undone.
        </p>

        {error && (
          <div
            className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}