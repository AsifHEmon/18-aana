import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Package, Search, X } from 'lucide-react';
import { safeParseJson } from '../lib/api.ts';
import { formatBDT } from '../lib/images.ts';
import type { OrderRecord } from '../types/store.ts';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  userName: string | null;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  city: string;
  paymentMethod: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productTitle: string;
    selectedSize?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  onGoogleSignIn,
  onSignOut,
  getAuthToken,
}) => {
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [trackCode, setTrackCode] = useState('');
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userEmail) return;
    let cancelled = false;
    (async () => {
      setLoadingOrders(true);
      try {
        const token = await getAuthToken();
        if (!token) return;
        const res = await fetch('/api/orders/mine', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await safeParseJson<OrderRecord[]>(res);
          setMyOrders(data);
        }
      } catch {
        // ignore silently
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userEmail, getAuthToken]);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTracked(null);
    if (!trackCode.trim()) return;
    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(trackCode.trim())}`,
        { credentials: 'include' }
      );
      const data = await safeParseJson<TrackedOrder>(res);
      setTracked(data);
    } catch (err: unknown) {
      setTrackError(
        err instanceof Error ? err.message : 'Unable to track order.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2b000a]/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full rounded-sm border border-[#e8d5d8] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Customer account and order tracking"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8d5d8]">
          <h2 className="font-display text-2xl text-[#1a0508]">
            Account &amp; order tracking
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-[#7a5c61] hover:text-[#1a0508]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Google Sign-In Section */}
          <div className="p-4 bg-[#fcf5f6] border border-[#e8d5d8] rounded-sm">
            {userEmail ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#1a0508]">
                    {userName || 'Signed in customer'}
                  </div>
                  <div className="text-xs text-[#7a5c61]">{userEmail}</div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#e8d5d8] bg-white rounded-sm hover:border-[#7a001e]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#1a0508]">
                    Sign in to save your order history
                  </div>
                  <div className="text-xs text-[#7a5c61]">
                    Guest checkout is always available without an account.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="px-4 py-2 bg-[#7a001e] text-white text-xs font-semibold rounded-sm hover:bg-[#4a0012] whitespace-nowrap shrink-0"
                >
                  Continue with Google
                </button>
              </div>
            )}
          </div>

          {/* Order Tracker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#1a0508]">
                Track an order
              </h3>
              <Link
                to="/track"
                onClick={onClose}
                className="text-xs font-medium text-[#7a001e] hover:underline"
              >
                Open tracking page
              </Link>
            </div>
            <form onSubmit={handleTrack} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7a5c61] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="Enter order number (e.g. 18A-...)"
                  className="w-full border border-[#e8d5d8] pl-9 pr-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1a0508] text-white text-sm font-medium rounded-sm hover:bg-[#7a001e]"
              >
                Track
              </button>
            </form>

            {trackError && (
              <p className="text-xs text-[#b3002d] mt-2">{trackError}</p>
            )}

            {tracked && (
              <div className="mt-3 p-4 border border-[#e8d5d8] rounded-sm text-sm space-y-2 tabular-nums">
                <div className="flex justify-between font-semibold text-[#1a0508]">
                  <span>Order #{tracked.orderNumber}</span>
                  <span className="text-[#7a001e]">{tracked.status}</span>
                </div>
                <div className="text-xs text-[#7a5c61]">
                  {tracked.city} · {tracked.paymentMethod}
                </div>
                {tracked.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>
                      {it.quantity} × {it.productTitle}
                      {it.selectedSize ? ` (${it.selectedSize})` : ''}
                    </span>
                    <span>{formatBDT(it.lineTotal)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#e8d5d8] flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatBDT(tracked.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Signed-in user order history */}
          {userEmail && (
            <div>
              <h3 className="text-sm font-semibold text-[#1a0508] mb-2">
                Your recent orders
              </h3>
              {loadingOrders ? (
                <p className="text-xs text-[#7a5c61]">Loading orders...</p>
              ) : myOrders.length === 0 ? (
                <div className="text-xs text-[#7a5c61] py-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>No orders linked to this account yet.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myOrders.map((o) => (
                    <Link
                      key={o.id}
                      to={`/track/${o.orderNumber}`}
                      onClick={onClose}
                      className="block p-3 border border-[#e8d5d8] rounded-sm text-xs tabular-nums hover:border-[#7a001e] transition-colors"
                    >
                      <div className="flex justify-between font-semibold text-[#1a0508]">
                        <span>#{o.orderNumber}</span>
                        <span className="text-[#7a001e]">{o.status}</span>
                      </div>
                      <div className="text-[#7a5c61] mt-1">
                        {o.items.length} item(s) · {formatBDT(o.totalAmount)} ·{' '}
                        {o.paymentMethod}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
