import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, MessageSquare, UtensilsCrossed, CalendarDays } from 'lucide-react';
import { MenuForm } from '../components/MenuForm';
import { WeeklyMenuForm } from '../components/WeeklyMenuForm';
import { MenuList } from '../components/MenuList';
import { ComplaintsAdmin } from '../components/ComplaintsAdmin';
import { MenuCalendar } from '../components/MenuCalendar';
import { useAuth } from '../context/AuthContext';

type TabType = 'menu' | 'calendar' | 'complaints';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [menuMode, setMenuMode] = useState<'single' | 'weekly'>('single');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleMenuSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-navy-900 p-2 rounded-lg" aria-hidden="true">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy-900">
                  Mess Menu System - Admin
                </h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <nav className="mb-8" role="tablist" aria-label="Admin dashboard sections">
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
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
              <Calendar className="w-5 h-5" aria-hidden="true" />
              Menu Management
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
          id="menu-panel"
          aria-labelledby="menu-tab"
          hidden={activeTab !== 'menu'}
        >
          <div className="mb-6 inline-flex gap-1 bg-white p-1 rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => setMenuMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                menuMode === 'single'
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Single Item
            </button>
            <button
              type="button"
              onClick={() => setMenuMode('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                menuMode === 'weekly'
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Weekly Menu
            </button>
          </div>

          {menuMode === 'single' ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <MenuForm onSuccess={handleMenuSuccess} />
              </div>
              <div>
                <MenuList refreshTrigger={refreshTrigger} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <WeeklyMenuForm onSuccess={handleMenuSuccess} />
              <MenuList refreshTrigger={refreshTrigger} />
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
          <ComplaintsAdmin />
        </div>
      </main>
    </div>
  );
}
