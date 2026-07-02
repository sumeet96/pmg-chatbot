import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, UserCircle, Shield } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex bg-white p-6 rounded-full mb-6 shadow-2xl">
            <UtensilsCrossed className="w-16 h-16 text-navy-900" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Mess Menu System
          </h1>
          <p className="text-xl text-gray-300">
            Select your role to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/student')}
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-navy-900 p-6 rounded-full mb-6 group-hover:bg-navy-800 transition-colors">
                <UserCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-3">
                Student Access
              </h2>
              <p className="text-gray-600">
                View mess menu, submit complaints, and check meal schedules
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-navy-900 p-6 rounded-full mb-6 group-hover:bg-navy-800 transition-colors">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-3">
                Admin Access
              </h2>
              <p className="text-gray-600">
                Manage menus, review complaints, and oversee system operations
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
