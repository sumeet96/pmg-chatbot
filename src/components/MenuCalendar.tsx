import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';

export function MenuCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthMenu();
  }, [currentDate]);

  const loadMonthMenu = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date')
      .order('meal_type');

    if (data) {
      setMenuItems(data);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getMenuForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return menuItems.filter(item => item.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = getDaysInMonth();

  const selectedDayMenu = selectedDate ? getMenuForDate(selectedDate) : [];
  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    evening_snacks: 'Evening Snacks',
    dinner: 'Dinner',
  };
  const mealOrder = { breakfast: 1, lunch: 2, evening_snacks: 3, dinner: 4 };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-navy-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-navy-900">{monthName}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                {day.slice(0, 3)}
              </div>
            ))}

            {days.map((day, index) => {
              const dayMenu = getMenuForDate(day);
              const isToday = day && day.toDateString() === new Date().toDateString();
              const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-[100px] border rounded-lg p-2 transition-all ${
                    !day
                      ? 'bg-gray-50'
                      : isSelected
                      ? 'bg-navy-100 border-navy-900 shadow-md'
                      : isToday
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white hover:bg-gray-50 cursor-pointer border-gray-200'
                  }`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${
                        isToday ? 'text-blue-600' : isSelected ? 'text-navy-900' : 'text-gray-700'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayMenu.slice(0, 4).map(item => (
                          <div
                            key={item.id}
                            className="text-xs px-2 py-1 bg-navy-900 text-white rounded truncate"
                            title={`${mealTypeLabels[item.meal_type]}: ${item.item_name}`}
                          >
                            {item.meal_type === 'evening_snacks' ? 'E' : item.meal_type.slice(0, 1).toUpperCase()}: {item.item_name.slice(0, 10)}
                          </div>
                        ))}
                        {dayMenu.length > 4 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayMenu.length - 4} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedDate ? (
            <div className="sticky top-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="w-5 h-5 text-navy-900" />
                  <h3 className="font-bold text-navy-900">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </h3>
                </div>

                {selectedDayMenu.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayMenu
                      .sort((a, b) => mealOrder[a.meal_type] - mealOrder[b.meal_type])
                      .map(item => (
                        <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-xs font-semibold text-navy-600 mb-1">
                            {mealTypeLabels[item.meal_type]}
                          </div>
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {item.item_name}
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 text-center py-8">
                    No menu items for this day
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sticky top-4 bg-gray-50 rounded-lg p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                Select a date to view menu details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
