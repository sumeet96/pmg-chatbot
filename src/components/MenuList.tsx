import { useEffect, useState } from 'react';
import { Calendar, Trash2, Loader2, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';

interface MenuListProps {
  refreshTrigger?: number;
}

export function MenuList({ refreshTrigger }: MenuListProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadMenuItems();
  }, [refreshTrigger]);

  const loadMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('meal_type');

    if (data) {
      setMenuItems(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    setDeletingId(id);
    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (!error) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    }
    setDeletingId(null);
  };

  const groupByDate = (items: MenuItem[]) => {
    const grouped: Record<string, MenuItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
    });
    return grouped;
  };

  const mealOrder = { breakfast: 1, lunch: 2, dinner: 3 };
  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
  };

  if (loading) {
    return (
      <div
        className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading menu items"
      >
        <Loader2 className="w-8 h-8 animate-spin text-navy-900 mb-3" aria-hidden="true" />
        <p className="text-gray-600">Loading menu items...</p>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming menus</h3>
        <p className="text-gray-600">Add menu items using the form above</p>
      </div>
    );
  }

  const groupedItems = groupByDate(menuItems);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-navy-900" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-navy-900">Upcoming Menus</h2>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedItems).map(([date, items]) => {
          const sortedItems = [...items].sort(
            (a, b) => mealOrder[a.meal_type] - mealOrder[b.meal_type]
          );

          return (
            <div key={date} className="border-l-4 border-navy-900 pl-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>

              <div className="space-y-4">
                {sortedItems.map((item) => (
                  <article
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="inline-block px-3 py-1 bg-navy-100 text-navy-900 text-sm font-medium rounded-full"
                            aria-label={`Meal type: ${mealLabels[item.meal_type]}`}
                          >
                            {mealLabels[item.meal_type]}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.item_name}
                        </h4>
                        {item.description && (
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:ring-4 focus:ring-red-300 focus:ring-opacity-50 disabled:opacity-50"
                        aria-label={`Delete ${item.item_name}`}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
