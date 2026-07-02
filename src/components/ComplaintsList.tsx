import { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';

export function ComplaintsList() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadComplaints();

      const channel = supabase
        .channel('complaints_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'complaints',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadComplaints();
          }
        )
        .subscribe();

      const handleComplaintSubmitted = () => {
        loadComplaints();
      };

      window.addEventListener('complaint-submitted', handleComplaintSubmitted);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('complaint-submitted', handleComplaintSubmitted);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadComplaints = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading complaints:', error);
    }

    if (data) {
      setComplaints(data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: Complaint['status']) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
      Resolved: 'bg-green-100 text-green-800 border-green-200',
    };

    const icons = {
      Pending: Clock,
      'In Progress': Loader2,
      Resolved: CheckCircle,
    };

    const Icon = icons[status];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status]}`}
        aria-label={`Status: ${status}`}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading complaints"
      >
        <Loader2 className="w-8 h-8 animate-spin text-navy-900 mb-3" aria-hidden="true" />
        <p className="text-gray-600">Loading your complaints...</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints yet</h3>
        <p className="text-gray-600">Your submitted complaints will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy-900 mb-4">Your Complaints</h2>
      {complaints.map((complaint) => (
        <article
          key={complaint.id}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block px-3 py-1 bg-navy-100 text-navy-900 text-sm font-medium rounded-full">
                  {complaint.category}
                </span>
                {getStatusBadge(complaint.status)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">{complaint.title}</h3>
              <p className="text-gray-700 mt-2">{complaint.description}</p>
            </div>
          </div>
          <time
            className="text-sm text-gray-500"
            dateTime={complaint.created_at}
          >
            Submitted {new Date(complaint.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </article>
      ))}
    </div>
  );
}
