import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import { safeParseJson } from '../lib/api.ts';
import { formatBDT } from '../lib/images.ts';
import type { CartItem } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (
    productId: number,
    selectedSize: string | null,
    quantity: number
  ) => void;
  onRemoveItem: (productId: number, selectedSize: string | null) => void;
  onClearCart: () => void;
  onOrderCompleted: () => void;
  getAuthToken: () => Promise<string | null>;
}

interface OrderConfirmation {
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  paymentReference?: string | null;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  city: string;
  paymentMethod: string;
  items: Array<{
    productTitle: string;
    selectedSize?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  getAuthToken,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState<'Dhaka' | 'Outside Dhaka'>('Dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>(
    'COD'
  );
  const [paymentReference, setPaymentReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const unit =
      item.product.discountPrice && item.product.discountPrice > 0
        ? item.product.discountPrice
        : item.product.basePrice;
    return sum + unit * item.quantity;
  }, 0);

  const deliveryCharge =
    items.length === 0
      ? 0
      : city === 'Dhaka'
        ? subtotal > 2500
          ? 0
          : 80
        : 150;
  const totalAmount = subtotal + deliveryCharge;
  const freeDhakaRemaining = Math.max(0, 2501 - subtotal);

  const handleClose = () => {
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmation(null);
    }
    setError(null);
    onClose();
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          customerName,
          phone,
          deliveryAddress,
          city,
          paymentMethod,
          paymentReference:
            paymentMethod === 'COD' ? null : paymentReference.trim(),
          items: items.map((i) => ({
            productId: i.product.id,
            selectedSize: i.selectedSize ?? null,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await safeParseJson<OrderConfirmation>(res);

      setConfirmation(data);
      setStep('confirmed');
      setPaymentReference('');
      onClearCart();
      onOrderCompleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#2b000a]/55"
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        className="relative z-10 w-full max-w-[440px] bg-white h-full flex flex-col border-l border-[#e8d5d8] shadow-2xl"
        aria-label="Shopping cart and checkout"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8d5d8]">
          <h2 className="font-display text-[28px] text-[#1a0508]">
            {step === 'cart'
              ? 'Your cart'
              : step === 'checkout'
                ? 'Delivery & payment'
                : 'Order confirmed'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close cart"
            className="p-1.5 text-[#7a5c61] hover:text-[#1a0508]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Cart Items */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="py-12 text-sm text-[#7a5c61]">
                  Your cart is empty. Add something from new and trending.
                </div>
              ) : (
                <div className="divide-y divide-[#e8d5d8]">
                  {items.map((item) => {
                    const unit =
                      item.product.discountPrice && item.product.discountPrice > 0
                        ? item.product.discountPrice
                        : item.product.basePrice;
                    return (
                      <div
                        key={`${item.product.id}-${item.selectedSize ?? 'default'}`}
                        className="py-4 flex gap-3.5 items-center"
                      >
                        <div className="w-14 h-18 rounded-sm overflow-hidden bg-[#fcf5f6] shrink-0">
                          <ResilientImage
                            src={item.product.imageUrls?.[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-[#1a0508] truncate">
                            {item.product.title}
                          </div>
                          <div className="text-xs text-[#7a5c61] tabular-nums mt-0.5">
                            {formatBDT(unit)} each
                            {item.selectedSize ? ` · Size: ${item.selectedSize}` : ''}
                          </div>
                          <div className="mt-2 inline-flex items-center border border-[#e8d5d8] rounded-sm">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQty(
                                  item.product.id,
                                  item.selectedSize ?? null,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-[#1a0508] hover:bg-[#fcf5f6]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQty(
                                  item.product.id,
                                  item.selectedSize ?? null,
                                  Math.min(
                                    item.product.stockQuantity,
                                    item.quantity + 1
                                  )
                                )
                              }
                              className="p-1 text-[#1a0508] hover:bg-[#fcf5f6]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-[#1a0508] tabular-nums">
                            {formatBDT(unit * item.quantity)}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveItem(
                                item.product.id,
                                item.selectedSize ?? null
                              )
                            }
                            aria-label={`Remove ${item.product.title}`}
                            className="mt-2 text-[#7a5c61] hover:text-[#7a001e]"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-[#e8d5d8] bg-[#fcf5f6]">
                <p className="text-xs text-[#7a5c61] mb-3">
                  {freeDhakaRemaining === 0
                    ? 'You qualify for free delivery inside Dhaka.'
                    : `Add ${formatBDT(freeDhakaRemaining)} more for free delivery inside Dhaka.`}
                </p>
                <div className="flex justify-between text-lg font-semibold text-[#1a0508] mb-4 tabular-nums">
                  <span>Subtotal</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 px-6 bg-[#7a001e] text-white font-semibold rounded-sm hover:bg-[#4a0012] transition-colors"
                >
                  Proceed to checkout
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Checkout Form */}
        {step === 'checkout' && (
          <form
            onSubmit={handleCheckoutSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 flex flex-col justify-between gap-5"
          >
            <div className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="p-3 text-sm bg-[#fcf5f6] border border-[#b3002d] text-[#7a001e] rounded-sm"
                >
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tasnim Rahman"
                  className="w-full border border-[#e8d5d8] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                  Mobile number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XX-XXXXXX"
                  className="w-full border border-[#e8d5d8] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                  Delivery zone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Dhaka', 'Outside Dhaka'] as const).map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setCity(zone)}
                      className={`py-2.5 px-3 text-sm font-medium border rounded-sm transition-colors ${
                        city === zone
                          ? 'border-[#7a001e] bg-[#fcf5f6] text-[#7a001e]'
                          : 'border-[#e8d5d8] text-[#1a0508]'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                  Delivery address
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House, road, block, area"
                  className="w-full border border-[#e8d5d8] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                  Payment method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'COD', label: 'Cash on Delivery' },
                      { id: 'bKash', label: 'bKash' },
                      { id: 'Nagad', label: 'Nagad' },
                    ] as const
                  ).map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-2.5 px-2 text-xs font-semibold border rounded-sm transition-colors ${
                        paymentMethod === method.id
                          ? 'border-[#7a001e] bg-[#7a001e] text-white'
                          : 'border-[#e8d5d8] text-[#1a0508]'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'COD' && (
                <div className="p-3.5 bg-[#fcf5f6] border border-[#e8d5d8] rounded-sm space-y-2.5">
                  <p className="text-xs text-[#7a5c61] leading-relaxed">
                    Send <strong className="text-[#1a0508] tabular-nums">{formatBDT(totalAmount)}</strong> via{' '}
                    <strong className="text-[#1a0508]">{paymentMethod}</strong> (Send Money) to our merchant wallet{' '}
                    <strong className="text-[#1a0508] tabular-nums">01711-000018</strong>, then enter the Transaction ID below.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                      {paymentMethod} Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. 9K7A2B1C4D"
                      className="w-full border border-[#e8d5d8] bg-white px-3 py-2 text-sm rounded-sm font-mono focus:outline-none focus:border-[#7a001e]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#e8d5d8] space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-[#7a5c61]">
                <span>Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#7a5c61]">
                <span>Delivery ({city})</span>
                <span>
                  {deliveryCharge === 0 ? 'Free' : formatBDT(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#1a0508] pt-2 border-t border-[#e8d5d8]">
                <span>Total payable</span>
                <span>{formatBDT(totalAmount)}</span>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 border border-[#e8d5d8] text-sm font-medium rounded-sm hover:border-[#1a0508]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-5 bg-[#7a001e] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] disabled:opacity-60"
                >
                  {submitting
                    ? 'Placing order...'
                    : `Confirm order · ${formatBDT(totalAmount)}`}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation Receipt */}
        {step === 'confirmed' && confirmation && (
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="flex items-center gap-2.5 text-[#7a001e] mb-3">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm font-semibold">
                Order #{confirmation.orderNumber} Confirmed — {confirmation.status}
              </span>
            </div>
            <p className="text-sm text-[#7a5c61] mb-6">
              Save your order number to track delivery status anytime from the Account menu.
            </p>

            <div className="border border-[#e8d5d8] rounded-sm p-4 bg-[#fcf5f6] space-y-2.5 text-sm tabular-nums">
              {confirmation.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-[#1a0508]">
                    {it.quantity} × {it.productTitle}
                    {it.selectedSize ? ` (Size: ${it.selectedSize})` : ''}
                  </span>
                  <span className="font-medium text-[#1a0508]">
                    {formatBDT(it.lineTotal)}
                  </span>
                </div>
              ))}
              <div className="pt-2.5 border-t border-[#e8d5d8] flex justify-between text-[#7a5c61]">
                <span>Delivery ({confirmation.city})</span>
                <span>
                  {confirmation.deliveryCharge === 0
                    ? 'Free'
                    : formatBDT(confirmation.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-[#1a0508]">
                <span>Total ({confirmation.paymentMethod})</span>
                <span>{formatBDT(confirmation.totalAmount)}</span>
              </div>
              {confirmation.paymentReference && (
                <div className="flex justify-between text-xs text-[#7a5c61] pt-1">
                  <span>Transaction ID</span>
                  <span className="font-mono text-[#1a0508]">
                    {confirmation.paymentReference}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2.5">
              <Link
                to={`/track/${confirmation.orderNumber}`}
                onClick={handleClose}
                className="block text-center w-full py-3 bg-[#7a001e] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] transition-colors"
              >
                Track delivery progress
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 border border-[#e8d5d8] text-[#1a0508] text-sm font-semibold rounded-sm hover:border-[#1a0508]"
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
