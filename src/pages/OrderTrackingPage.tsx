import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark.tsx';
import { Footer } from '../components/Footer.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { safeParseJson } from '../lib/api.ts';
import { formatBDT } from '../lib/images.ts';

interface TrackedOrderItem {
  id: number;
  productId: number;
  productTitle: string;
  selectedSize?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
}

interface TrackedOrderDetail {
  id: number;
  orderNumber: string;
  customerName: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  city: 'Dhaka' | 'Outside Dhaka';
  paymentMethod: string;
  paymentStatus?: string;
  paymentReference?: string | null;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: TrackedOrderItem[];
}

const PROGRESS_STEPS: Array<{
  key: 'Pending' | 'Shipped' | 'Delivered';
  label: string;
  description: string;
}> = [
  {
    key: 'Pending',
    label: 'Order Confirmed',
    description: 'Received and being packed at our Dhaka atelier.',
  },
  {
    key: 'Shipped',
    label: 'Out for Delivery',
    description: 'Handed over to courier and on the way to your address.',
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    description: 'Package received. 7-day easy exchange applies.',
  },
];

function getStepIndex(status: TrackedOrderDetail['status']): number {
  if (status === 'Delivered') return 2;
  if (status === 'Shipped') return 1;
  if (status === 'Pending') return 0;
  return -1;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber: routeOrderParam } = useParams<{ orderNumber?: string }>();
  const navigate = useNavigate();

  const [query, setQuery] = useState(routeOrderParam ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrderDetail | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const lookupOrder = useCallback(async (rawCode: string) => {
    const cleaned = rawCode.trim().replace(/^#/, '');
    if (!cleaned) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(cleaned)}`,
        { credentials: 'include' }
      );
      const data = await safeParseJson<TrackedOrderDetail>(res);
      setOrder(data);
    } catch (err: unknown) {
      setOrder(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to look up that order right now.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeOrderParam) {
      setQuery(routeOrderParam);
      lookupOrder(routeOrderParam);
    }
  }, [routeOrderParam, lookupOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim().replace(/^#/, '');
    if (!cleaned) return;
    navigate(`/track/${encodeURIComponent(cleaned)}`);
  };

  const activeStepIdx = order ? getStepIndex(order.status) : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf5f6] text-[#1a0508]">
      {/* Announcement Strip */}
      <div className="bg-[#7a001e] text-white text-[13px] py-1.5">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between gap-4">
          <span>Free delivery in Dhaka on orders above ৳2,500</span>
          <span className="hidden sm:inline">
            Inside Dhaka: 1–2 days · Outside Dhaka: 3–5 days
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[#e8d5d8]">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
            aria-label="18 aana home"
          >
            <BrandMark size={38} />
            <span className="font-display text-[28px] leading-none tracking-[-0.5px] text-[#1a0508]">
              18 <em className="italic text-[#b3002d]">aana</em>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to storefront</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Search Hero Band */}
        <section className="bg-[#7a001e] text-white py-12 sm:py-16">
          <div className="max-w-[820px] mx-auto px-6">
            <h1 className="font-display text-[38px] sm:text-[52px] leading-[1.06] tracking-[-1px] [text-wrap:balance]">
              Track your order
            </h1>
            <p className="text-white/85 mt-3 text-base max-w-[52ch]">
              Enter the order ID from your confirmation receipt (for example,{' '}
              <span className="font-mono text-[#ffccd5]">18A-...</span>) to view
              live dispatch and delivery progress.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7a5c61] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter order ID (e.g. 18A-K9M2P41)"
                  aria-label="Order ID"
                  className="w-full bg-white text-[#1a0508] placeholder:text-[#7a5c61] pl-10 pr-4 py-3.5 text-sm rounded-sm border border-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3.5 bg-[#1a0508] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {loading ? 'Checking...' : 'Track order'}
              </button>
            </form>
          </div>
        </section>

        {/* Results Container */}
        <section className="max-w-[820px] mx-auto px-6 py-10">
          {loading && (
            <div className="bg-white border border-[#e8d5d8] rounded-sm p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-[#fcf5f6] w-1/3 rounded-sm" />
              <div className="h-24 bg-[#fcf5f6] w-full rounded-sm" />
              <div className="h-32 bg-[#fcf5f6] w-full rounded-sm" />
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="bg-white border border-[#b3002d] rounded-sm p-6 text-sm text-[#7a001e]"
            >
              <div className="font-semibold text-base mb-1">
                Order not found
              </div>
              <p className="text-[#7a5c61]">
                {error} Double-check the order ID from your checkout confirmation
                screen (for example, <span className="font-mono">18A-...</span>
                ).
              </p>
            </div>
          )}

          {!loading && !error && !order && !hasSearched && (
            <div className="bg-white border border-[#e8d5d8] rounded-sm p-8">
              <h2 className="font-display text-2xl text-[#1a0508] mb-3">
                Delivery timelines across Bangladesh
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm pt-2">
                <div>
                  <div className="font-semibold text-[#1a0508]">
                    Inside Dhaka
                  </div>
                  <p className="text-[#7a5c61] mt-1">
                    1–2 business days. Free on orders above ৳2,500, otherwise
                    ৳80.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-[#1a0508]">
                    Outside Dhaka
                  </div>
                  <p className="text-[#7a5c61] mt-1">
                    3–5 business days nationwide via courier for ৳150 flat.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-[#1a0508]">
                    Easy Exchanges
                  </div>
                  <p className="text-[#7a5c61] mt-1">
                    Unworn items with tags can be exchanged within 7 days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && order && (
            <div className="space-y-6">
              {/* Order Summary Header Card */}
              <div className="bg-white border border-[#e8d5d8] rounded-sm p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#e8d5d8]">
                  <div>
                    <div className="text-xs text-[#7a5c61]">
                      Order ID{' '}
                      <span className="font-mono font-semibold text-[#1a0508]">
                        #{order.orderNumber}
                      </span>
                      <span className="mx-2" aria-hidden="true">
                        ·
                      </span>
                      <span>Placed {formatDate(order.createdAt)}</span>
                    </div>
                    <h2 className="font-display text-3xl text-[#1a0508] mt-1">
                      {order.status === 'Pending' && 'Preparing your order'}
                      {order.status === 'Shipped' && 'Your order is on the way'}
                      {order.status === 'Delivered' && 'Order delivered'}
                      {order.status === 'Cancelled' && 'Order cancelled'}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7a001e]">
                      {order.status === 'Delivered' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : order.status === 'Cancelled' ? (
                        <XCircle className="w-4 h-4" />
                      ) : order.status === 'Shipped' ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>Status: {order.status}</span>
                    </div>
                    <div className="text-xs text-[#7a5c61] mt-1">
                      Updated {formatDate(order.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Progress Stepper */}
                {order.status === 'Cancelled' ? (
                  <div className="mt-6 p-4 bg-[#fcf5f6] border border-[#e8d5d8] rounded-sm text-sm text-[#7a001e] flex items-start gap-3">
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">
                        This order has been cancelled
                      </div>
                      <p className="text-xs text-[#7a5c61] mt-0.5">
                        If you have questions or already sent a bKash/Nagad
                        payment, please reach out through our support chat on
                        the storefront.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PROGRESS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= activeStepIdx;
                      const isCurrent = idx === activeStepIdx;
                      const StepIcon =
                        idx === 0
                          ? Package
                          : idx === 1
                            ? Truck
                            : CheckCircle2;

                      return (
                        <div
                          key={step.key}
                          className={`p-4 border rounded-sm transition-colors ${
                            isCurrent
                              ? 'border-[#7a001e] bg-[#fcf5f6]'
                              : isCompleted
                                ? 'border-[#e8d5d8] bg-white'
                                : 'border-[#e8d5d8] bg-white opacity-55'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-[#7a001e] tabular-nums">
                              0{idx + 1}.
                            </span>
                            <StepIcon
                              className={`w-4 h-4 ${
                                isCompleted
                                  ? 'text-[#7a001e]'
                                  : 'text-[#7a5c61]'
                              }`}
                            />
                          </div>
                          <div className="text-sm font-semibold text-[#1a0508]">
                            {step.label}
                          </div>
                          <p className="text-xs text-[#7a5c61] mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Shipping Metadata Strip */}
                <div className="mt-6 pt-5 border-t border-[#e8d5d8] grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-[#7a5c61]">Recipient</div>
                    <div className="font-medium text-[#1a0508] mt-0.5">
                      {order.customerName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7a5c61]">Delivery Zone</div>
                    <div className="font-medium text-[#1a0508] mt-0.5">
                      {order.city} ·{' '}
                      {order.city === 'Dhaka' ? '1–2 days' : '3–5 days'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7a5c61]">Payment</div>
                    <div className="font-medium text-[#1a0508] mt-0.5">
                      {order.paymentMethod === 'COD'
                        ? 'Cash on Delivery'
                        : order.paymentMethod}
                      {order.paymentReference
                        ? ` · TrxID: ${order.paymentReference}`
                        : order.paymentStatus
                          ? ` · ${order.paymentStatus}`
                          : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items & Receipt Breakdown */}
              <div className="bg-white border border-[#e8d5d8] rounded-sm p-6 sm:p-8">
                <h3 className="font-display text-2xl text-[#1a0508] mb-4">
                  Items in this order
                </h3>

                <div className="divide-y divide-[#e8d5d8]">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center gap-4"
                    >
                      <div className="w-14 h-18 rounded-sm overflow-hidden bg-[#fcf5f6] border border-[#e8d5d8] shrink-0">
                        <ResilientImage
                          src={item.imageUrl}
                          alt={item.productTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#1a0508] truncate">
                          {item.productTitle}
                        </div>
                        <div className="text-xs text-[#7a5c61] tabular-nums mt-0.5">
                          {item.quantity} × {formatBDT(item.unitPrice)}
                          {item.selectedSize ? ` · Size: ${item.selectedSize}` : ''}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#1a0508] tabular-nums shrink-0">
                        {formatBDT(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[#e8d5d8] space-y-2 text-sm tabular-nums">
                  <div className="flex justify-between text-[#7a5c61]">
                    <span>Subtotal</span>
                    <span>{formatBDT(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#7a5c61]">
                    <span>Delivery ({order.city})</span>
                    <span>
                      {order.deliveryCharge === 0
                        ? 'Free'
                        : formatBDT(order.deliveryCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-[#1a0508] pt-2 border-t border-[#e8d5d8]">
                    <span>Total</span>
                    <span>{formatBDT(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};
