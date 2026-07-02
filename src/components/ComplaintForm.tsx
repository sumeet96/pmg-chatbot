import { useState, FormEvent } from 'react';
import { AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const COMPLAINT_CATEGORIES = ['Food Quality', 'Hygiene', 'Service', 'Other'] as const;

interface ComplaintFormProps {
  onSubmitSuccess?: () => void;
}

export function ComplaintForm({ onSubmitSuccess }: ComplaintFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('complaints').insert({
        user_id: user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        status: 'Pending',
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory(COMPLAINT_CATEGORIES[0]);

      window.dispatchEvent(new CustomEvent('complaint-submitted'));

      setTimeout(() => {
        setSuccess(false);
        onSubmitSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-navy-900 mb-6">Submit a Complaint</h2>

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
          <span className="text-sm">Complaint submitted successfully!</span>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="complaint-title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="complaint-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Brief summary of your complaint..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
            aria-required="true"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="complaint-category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="complaint-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none"
            aria-required="true"
            disabled={loading}
          >
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="complaint-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="complaint-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Describe your complaint in detail..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none resize-none"
            aria-required="true"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
          className="w-full bg-navy-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-navy-800 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label="Submit complaint"
        >
          <Send className="w-5 h-5" aria-hidden="true" />
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </div>
    </form>
  );
}
