import { useEffect, useState } from 'react';
import { Clock, CheckCircle, Loader2, AlertOctagon, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Complaint } from '../types';

export function ComplaintsAdmin() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadComplaints();

    const channel = supabase
      .channel('admin_complaints_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
        },
        () => {
          loadComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setComplaints(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: Complaint['status']) => {
    setUpdatingId(id);

    const { error } = await supabase
      .from('complaints')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setComplaints(
        complaints.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    }

    setUpdatingId(null);
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

  const filteredComplaints = filterStatus === 'all'
    ? complaints
    : complaints.filter((c) => c.status === filterStatus);

  const statusCounts = {
    all: complaints.length,
    Pending: complaints.filter((c) => c.status === 'Pending').length,
    'In Progress': complaints.filter((c) => c.status === 'In Progress').length,
    Resolved: complaints.filter((c) => c.status === 'Resolved').length,
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
        <p className="text-gray-600">Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertOctagon className="w-6 h-6 text-navy-900" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-navy-900">All Complaints</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {(['all', 'Pending', 'In Progress', 'Resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
              filterStatus === status
                ? 'bg-navy-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`Filter by ${status}`}
            aria-pressed={filterStatus === status}
          >
            {status === 'all' ? 'All' : status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <AlertOctagon className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-600">
            {filterStatus === 'all'
              ? 'No complaints have been submitted yet'
              : `No ${filterStatus} complaints`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <article
              key={complaint.id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-100 text-navy-900 text-sm font-medium rounded-full">
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                      {complaint.category}
                    </span>
                    {getStatusBadge(complaint.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-3">{complaint.title}</h3>
                  <p className="text-gray-700 mt-2 leading-relaxed">{complaint.description}</p>
                  <time
                    className="text-sm text-gray-500 mt-2 block"
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
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <select
                  value={complaint.status}
                  onChange={(e) =>
                    updateStatus(complaint.id, e.target.value as Complaint['status'])
                  }
                  disabled={updatingId === complaint.id}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none disabled:opacity-50"
                  aria-label="Update complaint status"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
