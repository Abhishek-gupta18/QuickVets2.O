import { Star, Activity, MessageSquare } from 'lucide-react';
import { MetricTile, EmptyState } from '../shared';
import type { VetClinic, ClinicReview } from '../../../types';

interface ReviewsTabProps {
  clinic: VetClinic;
  clinicReviews: ClinicReview[];
}

export default function ReviewsTab({ clinic, clinicReviews }: ReviewsTabProps) {
  const newReviews = clinicReviews.filter(
    (review) =>
      review.date >= new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
  );

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Reviews and ratings</h3>
        <p className="text-sm text-slate-500">
          Feedback is read-only to preserve transparency.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          icon={Star}
          label="Overall"
          value={clinic.rating.toFixed(1)}
          hint="Average public rating"
        />
        <MetricTile
          icon={MessageSquare}
          label="New Reviews"
          value={newReviews.length}
          hint="Received in the last seven days"
        />
        <MetricTile
          icon={Activity}
          label="Satisfaction"
          value={`${Math.round(clinic.rating * 20)}%`}
          hint="Derived from star score"
        />
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {clinicReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{review.userName}</p>
              <span className="text-xs text-slate-400">{review.date}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-500">
                {review.petType}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{review.reviewText}</p>
          </div>
        ))}

        {!clinicReviews.length && (
          <EmptyState message="No clinic reviews yet." />
        )}
      </div>
    </section>
  );
}
