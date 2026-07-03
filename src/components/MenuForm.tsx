import { useState, FormEvent } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatLocalDate } from '../lib/date';
import { useAuth } from '../context/AuthContext';

interface MenuFormProps {
  onSuccess?: () => void;
}

export function MenuForm({ onSuccess }: MenuFormProps) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'evening_snacks' | 'dinner'>('breakfast');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add menu items');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('menu_items').insert({
        date,
        meal_type: mealType,
        item_name: itemName.trim(),
        description: description.trim(),
        created_by: user.id,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('A meal for this date and time slot already exists');
        }
        throw insertError;
      }

      setSuccess(true);
      setItemName('');
      setDescription('');
      setDate('');

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  const minDate = formatLocalDate(new Date());

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6 text-navy-900" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-navy-900">Add Menu Item</h2>
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
          <span className="text-sm">Menu item added successfully!</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="menu-date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            id="menu-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
            aria-required="true"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="meal-type" className="block text-sm font-medium text-gray-700 mb-2">
            Meal Type
          </label>
          <select
            id="meal-type"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as 'breakfast' | 'lunch' | 'evening_snacks' | 'dinner')}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
            aria-required="true"
            disabled={loading}
          >
            <option value="breakfast">Breakfast (8:00 - 10:30 AM)</option>
            <option value="lunch">Lunch (12:00 - 2:30 PM)</option>
            <option value="evening_snacks">Evening Snacks (5:30 - 6:30 PM)</option>
            <option value="dinner">Dinner (8:00 - 10:00 PM)</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-2">
          Item Name
        </label>
        <input
          id="item-name"
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
          placeholder="e.g., Paneer Butter Masala with Rice"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
          aria-required="true"
          disabled={loading}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add additional details about the meal..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none resize-none"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !itemName.trim() || !date}
        className="mt-6 w-full bg-navy-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-navy-800 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        aria-label="Add menu item"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        {loading ? 'Adding...' : 'Add Menu Item'}
      </button>
    </form>
  );
}
