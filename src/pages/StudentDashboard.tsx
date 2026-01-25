import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar as CalendarIcon, MessageSquare, UtensilsCrossed, Loader2, CalendarDays, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';
import { MenuCard } from '../components/MenuCard';
import { ComplaintForm } from '../components/ComplaintForm';
import { ComplaintsList } from '../components/ComplaintsList';
import { MenuCalendar } from '../components/MenuCalendar';
import { Chatbot } from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';

type TabType = 'chatbot' | 'menu' | 'calendar' | 'complaints';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chatbot');

  useEffect(() => {
    loadTodayMenu();
  }, []);

  const loadTodayMenu = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('date', today)
      .order('meal_type');

    if (data) {
      setMenuItems(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const mealOrder = { breakfast: 1, lunch: 2, evening_snacks: 3, dinner: 4 };
  const sortedMenuItems = [...menuItems].sort(
    (a, b) => mealOrder[a.meal_type] - mealOrder[b.meal_type]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-navy-900 p-2 rounded-lg" aria-hidden="true">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy-900">Mess Menu System</h1>
                <p className="text-sm text-gray-600">Student Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <nav className="mb-8" role="tablist" aria-label="Dashboard sections">
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
            <button
              role="tab"
              aria-selected={activeTab === 'chatbot'}
              aria-controls="chatbot-panel"
              id="chatbot-tab"
              onClick={() => setActiveTab('chatbot')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
                activeTab === 'chatbot'
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bot className="w-5 h-5" aria-hidden="true" />
              AI Assistant
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'menu'}
              aria-controls="menu-panel"
              id="menu-tab"
              onClick={() => setActiveTab('menu')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
                activeTab === 'menu'
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="w-5 h-5" aria-hidden="true" />
              Today's Menu
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'calendar'}
              aria-controls="calendar-panel"
              id="calendar-tab"
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
                activeTab === 'calendar'
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-5 h-5" aria-hidden="true" />
              Menu Calendar
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'complaints'}
              aria-controls="complaints-panel"
              id="complaints-tab"
              onClick={() => setActiveTab('complaints')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
                activeTab === 'complaints'
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
              Complaints
            </button>
          </div>
        </nav>

        <div
          role="tabpanel"
          id="chatbot-panel"
          aria-labelledby="chatbot-tab"
          hidden={activeTab !== 'chatbot'}
        >
          <Chatbot />
        </div>

        <div
          role="tabpanel"
          id="menu-panel"
          aria-labelledby="menu-tab"
          hidden={activeTab !== 'menu'}
        >
          {loading ? (
            <div
              className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center"
              role="status"
              aria-live="polite"
              aria-label="Loading menu"
            >
              <Loader2 className="w-8 h-8 animate-spin text-navy-900 mb-3" aria-hidden="true" />
              <p className="text-gray-600">Loading today's menu...</p>
            </div>
          ) : sortedMenuItems.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <CalendarIcon className="w-6 h-6 text-navy-900" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-navy-900">
                  Today's Menu - {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
              </div>
              <div className="grid gap-6">
                {sortedMenuItems.map((item) => (
                  <MenuCard key={item.id} menuItem={item} onFeedbackSubmit={loadTodayMenu} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu available</h3>
              <p className="text-gray-600">Today's menu hasn't been posted yet. Check back later!</p>
            </div>
          )}
        </div>

        <div
          role="tabpanel"
          id="calendar-panel"
          aria-labelledby="calendar-tab"
          hidden={activeTab !== 'calendar'}
        >
          <MenuCalendar />
        </div>

        <div
          role="tabpanel"
          id="complaints-panel"
          aria-labelledby="complaints-tab"
          hidden={activeTab !== 'complaints'}
        >
          <div className="space-y-6">
            <ComplaintForm onSubmitSuccess={loadTodayMenu} />
            <ComplaintsList />
          </div>
        </div>
      </main>
    </div>
  );
}
