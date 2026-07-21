import { useMemo, useState, FormEvent } from 'react';
import { CalendarDays, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatLocalDate } from '../lib/date';
import { useAuth } from '../context/AuthContext';

interface WeeklyMenuFormProps {
  onSuccess?: () => void;
}

type MealType = 'breakfast' | 'lunch' | 'evening_snacks' | 'dinner';

const MEALS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'evening_snacks', label: 'Evening Snacks' },
  { key: 'dinner', label: 'Dinner' },
];

// Meal timings kept consistent with the single-item form and the schema.
const MEAL_TIMES: Record<MealType, { time_start: string; time_end: string }> = {
  breakfast: { time_start: '08:00', time_end: '10:30' },
  lunch: { time_start: '12:00', time_end: '14:30' },
  evening_snacks: { time_start: '17:30', time_end: '18:30' },
  dinner: { time_start: '20:00', time_end: '22:00' },
};

// The next upcoming Monday (always in the future).
function nextMonday(): string {
  const d = new Date();
  const diff = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return formatLocalDate(d);
}

export function WeeklyMenuForm({ onSuccess }: WeeklyMenuFormProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(nextMonday());
  const [items, setItems] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const minDate = formatLocalDate(new Date());

  // The 7 dates of the selected week, derived from the start date.
  const days = useMemo(() => {
    if (!startDate) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(`${startDate}T00:00:00`);
      d.setDate(d.getDate() + i);
      return {
        iso: formatLocalDate(d),
        label: d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      };
    });
  }, [startDate]);

  const cellKey = (dateIso: string, meal: MealType) => `${dateIso}__${meal}`;

  const filledCount = Object.values(items).filter((v) => v.trim()).length;

  const handleChange = (dateIso: string, meal: MealType, value: string) => {
    setItems((prev) => ({ ...prev, [cellKey(dateIso, meal)]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You must be logged in to add menu items');
      return;
    }

    const rows = days.flatMap((day) =>
      MEALS.flatMap((meal) => {
        const value = (items[cellKey(day.iso, meal.key)] || '').trim();
        if (!value) return [];
        return [
          {
            date: day.iso,
            meal_type: meal.key,
            item_name: value,
            description: '',
            time_start: MEAL_TIMES[meal.key].time_start,
            time_end: MEAL_TIMES[meal.key].time_end,
            created_by: user.id,
          },
        ];
      })
    );

    if (rows.length === 0) {
      setError('Add at least one item before saving.');
      return;
    }

    setLoading(true);
    try {
      // Upsert so re-saving a week overwrites existing entries instead of
      // failing on the (date, meal_type) unique constraint.
      const { error: upsertError } = await supabase
        .from('menu_items')
        .upsert(rows, { onConflict: 'date,meal_type' });

      if (upsertError) throw upsertError;

      setSuccess(`Saved ${rows.length} menu item${rows.length === 1 ? '' : 's'} for the week.`);
      setTimeout(() => {
        setSuccess('');
        onSuccess?.();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save the weekly menu');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setItems({});
    setError('');
    setSuccess('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-6 h-6 text-navy-900" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-navy-900">Add Weekly Menu</h2>
      </div>

      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div
          className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label htmlFor="week-start" className="block text-sm font-medium text-gray-700 mb-2">
            Week starting
          </label>
          <input
            id="week-start"
            type="date"
            value={startDate}
            min={minDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
            disabled={loading}
          />
        </div>
        <p className="text-sm text-gray-500 pb-3">
          Leave a cell blank to skip it. Saving overwrites existing items for the same date and meal.
        </p>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-sm font-semibold text-gray-700 p-2 whitespace-nowrap">
                Day
              </th>
              {MEALS.map((meal) => (
                <th
                  key={meal.key}
                  className="text-left text-sm font-semibold text-gray-700 p-2 min-w-[180px]"
                >
                  {meal.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.iso} className="border-t border-gray-100">
                <td className="p-2 text-sm font-medium text-navy-900 whitespace-nowrap align-top pt-4">
                  {day.label}
                </td>
                {MEALS.map((meal) => (
                  <td key={meal.key} className="p-2 align-top">
                    <input
                      type="text"
                      value={items[cellKey(day.iso, meal.key)] || ''}
                      onChange={(e) => handleChange(day.iso, meal.key, e.target.value)}
                      placeholder="e.g., Puri, Aloo Sabji, Tea"
                      aria-label={`${meal.label} for ${day.label}`}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
                      disabled={loading}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm text-gray-500">
          {filledCount} item{filledCount === 1 ? '' : 's'} ready to save
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || filledCount === 0}
            className="px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading || filledCount === 0}
            className="bg-navy-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-navy-800 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <CalendarDays className="w-5 h-5" aria-hidden="true" />
            )}
            {loading ? 'Saving...' : 'Save Weekly Menu'}
          </button>
        </div>
      </div>
    </form>
  );
}
