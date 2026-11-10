import React from 'react';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatBDT } from '../lib/images.ts';
import type { Product } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onRemoveWishlist: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  onInspectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveWishlist,
  onAddToCart,
  onInspectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#2b000a]/55"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="relative z-10 w-full max-w-[420px] bg-white h-full flex flex-col border-l border-[#e8d5d8] shadow-2xl"
        aria-label="Saved wishlist items"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8d5d8]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#7a001e]" />
            <h2 className="font-display text-[28px] text-[#1a0508]">
              Saved wishlist
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="p-1.5 text-[#7a5c61] hover:text-[#1a0508]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-display text-2xl text-[#1a0508]">
                No saved pieces yet
              </p>
              <p className="text-sm text-[#7a5c61] mt-1.5 max-w-[30ch] mx-auto">
                Tap the heart icon on any sharee, punjabi, or winter piece to keep it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8d5d8]">
              {items.map((product) => {
                const effectivePrice =
                  product.discountPrice && product.discountPrice > 0
                    ? product.discountPrice
                    : product.basePrice;
                const hasSizes =
                  Array.isArray(product.sizes) && product.sizes.length > 0;
                const outOfStock = product.stockQuantity <= 0;

                return (
                  <div key={product.id} className="py-4 flex gap-3.5 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onInspectProduct(product);
                      }}
                      className="w-16 h-20 rounded-sm overflow-hidden bg-[#fcf5f6] shrink-0"
                    >
                      <ResilientImage
                        src={product.imageUrls?.[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onInspectProduct(product);
                        }}
                        className="font-semibold text-sm text-[#1a0508] hover:text-[#7a001e] truncate block text-left w-full"
                      >
                        {product.title}
                      </button>
                      <div className="text-xs text-[#7a5c61] mt-0.5">
                        {product.department} · {product.categoryName}
                      </div>
                      <div className="text-sm font-semibold text-[#7a001e] tabular-nums mt-0.5">
                        {formatBDT(effectivePrice)}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            if (hasSizes) {
                              onClose();
                              onInspectProduct(product);
                            } else {
                              onAddToCart(product);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7a001e] text-white text-xs font-semibold rounded-sm hover:bg-[#4a0012] disabled:bg-[#e8d5d8] disabled:text-[#7a5c61] transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {outOfStock
                              ? 'Out of stock'
                              : hasSizes
                                ? 'Select size'
                                : 'Add to cart'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveWishlist(product.id)}
                          aria-label={`Remove ${product.title} from wishlist`}
                          className="p-1.5 text-[#7a5c61] hover:text-[#b3002d]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
