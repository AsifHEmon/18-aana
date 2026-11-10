import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { safeParseJson } from '../lib/api.ts';
import type { FeedbackItem } from '../types/store.ts';

interface FeedbackSectionProps {
  feedbacks: FeedbackItem[];
  onFeedbackSubmitted: (item: FeedbackItem) => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  feedbacks,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('Product quality');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, topic, rating, message }),
      });
      const data = await safeParseJson<FeedbackItem>(res);
      onFeedbackSubmitted(data);
      setName('');
      setMessage('');
      setRating(5);
      setStatusMsg('Thank you. Your feedback was saved.');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to send feedback.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const displayedQuotes = feedbacks.slice(0, 2);

  return (
    <section id="feedback" className="bg-[#7a001e] text-white py-16">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.06] tracking-[-0.8px] mb-3 [text-wrap:balance]">
            Your feedback shapes our shelves
          </h2>
          <p className="text-white/85 text-base max-w-[46ch]">
            Rate your order or suggest a product. We read every message and reply within two days.
          </p>

          <div className="mt-7 space-y-4">
            {displayedQuotes.map((q) => (
              <div
                key={q.id}
                className="border border-white/25 rounded-sm p-4 bg-[#4a0012]/35"
              >
                <p className="text-sm sm:text-base text-white/95">
                  “{q.message}”
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/75">
                  <span className="font-medium text-white">{q.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{q.topic}</span>
                  <span aria-hidden="true">·</span>
                  <span>{q.rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <div className="flex items-center gap-1" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} stars`}
                className="p-1 focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    star <= rating
                      ? 'text-[#d4af37] fill-[#d4af37]'
                      : 'text-white/35'
                  }`}
                />
              </button>
            ))}
          </div>

          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-white/35 bg-transparent text-white placeholder:text-white/60 px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-white"
          />

          <select
            aria-label="Feedback topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border border-white/35 bg-[#7a001e] text-white px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-white"
          >
            <option value="Product quality">Product quality</option>
            <option value="Delivery">Delivery</option>
            <option value="Size and fit">Size and fit</option>
            <option value="Suggestion">Suggestion</option>
          </select>

          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message"
            className="w-full border border-white/35 bg-transparent text-white placeholder:text-white/60 px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-white"
          />

          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3 bg-white text-[#7a001e] font-semibold rounded-sm hover:bg-[#fcf5f6] disabled:opacity-60 transition-colors justify-self-start"
          >
            {submitting ? 'Sending...' : 'Send feedback'}
          </button>

          {statusMsg && (
            <div role="status" className="text-sm font-medium text-[#ffccd5]">
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div role="alert" className="text-sm font-medium text-[#ffccd5]">
              {errorMsg}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
