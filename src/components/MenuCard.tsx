import { useState, useEffect } from 'react';
import { Star, MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MenuItem, Feedback } from '../types';
import { useAuth } from '../context/AuthContext';

interface MenuCardProps {
  menuItem: MenuItem;
  onFeedbackSubmit?: () => void;
}

export function MenuCard({ menuItem, onFeedbackSubmit }: MenuCardProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [didEat, setDidEat] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeedback();
    }
  }, [menuItem.id, user]);

  const loadFeedback = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('menu_item_id', menuItem.id)
      .maybeSingle();

    if (data) {
      setFeedback(data);
      setRating(data.rating || 0);
      setDidEat(data.ate);
      setComment(data.comment);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const feedbackData = {
        user_id: user.id,
        menu_item_id: menuItem.id,
        rating: rating > 0 ? rating : null,
        ate: didEat,
        comment: comment.trim(),
      };

      if (feedback) {
        await supabase
          .from('feedback')
          .update(feedbackData)
          .eq('id', feedback.id);
      } else {
        await supabase.from('feedback').insert(feedbackData);
      }

      await loadFeedback();
      setShowFeedback(false);
      onFeedbackSubmit?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    evening_snacks: 'Evening Snacks',
    dinner: 'Dinner',
  };

  return (
    <article className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <span
            className="inline-block px-3 py-1 bg-navy-100 text-navy-900 text-sm font-medium rounded-full mb-2"
            aria-label={`Meal type: ${mealTypeLabels[menuItem.meal_type]}`}
          >
            {mealTypeLabels[menuItem.meal_type]}
          </span>
          <h3 className="text-xl font-bold text-navy-900">{menuItem.item_name}</h3>
          {menuItem.description && (
            <p className="text-gray-600 mt-2">{menuItem.description}</p>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium flex items-center gap-2">
            <Check className="w-4 h-4" aria-hidden="true" />
            Feedback submitted
            {feedback.rating && ` - ${feedback.rating} stars`}
          </p>
        </div>
      )}

      {!showFeedback ? (
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full bg-navy-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-navy-800 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 transition-all duration-200"
          aria-label={feedback ? 'Edit your feedback' : 'Provide feedback'}
        >
          {feedback ? 'Edit Feedback' : 'Provide Feedback'}
        </button>
      ) : (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Did you eat this meal?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDidEat(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
                  didEat
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={didEat}
                aria-label="Yes, I ate this meal"
              >
                <Check className="w-5 h-5 mx-auto" aria-hidden="true" />
                <span className="sr-only">Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setDidEat(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 ${
                  !didEat
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={!didEat}
                aria-label="No, I did not eat this meal"
              >
                <X className="w-5 h-5 mx-auto" aria-hidden="true" />
                <span className="sr-only">No</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate this meal (optional)
            </label>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label="Star rating"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 rounded transition-transform hover:scale-110"
                  aria-label={`Rate ${star} stars`}
                  aria-checked={rating === star}
                  role="radio"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor={`comment-${menuItem.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              id={`comment-${menuItem.id}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your thoughts about this meal..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all duration-200 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmitFeedback}
              disabled={loading}
              className="flex-1 bg-navy-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-navy-800 focus:ring-4 focus:ring-navy-900 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Submit feedback"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition-all duration-200"
              aria-label="Cancel feedback"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
