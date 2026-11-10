import React from 'react';
import { Heart } from 'lucide-react';
import { formatBDT } from '../lib/images.ts';
import type { Product } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
  onQuickAdd: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onQuickAdd,
  onSelectProduct,
}) => {
  const effectivePrice =
    product.discountPrice !== null && product.discountPrice > 0
      ? product.discountPrice
      : product.basePrice;
  const hasDiscount =
    product.discountPrice !== null &&
    product.discountPrice > 0 &&
    product.discountPrice < product.basePrice;
  const outOfStock = product.stockQuantity <= 0;
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const primaryImage = product.imageUrls?.[0] ?? 'punjabi';

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-[#fcf5f6]">
        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          className="w-full h-full block text-left focus:outline-none"
          aria-label={`View details for ${product.title}`}
        >
          <ResilientImage
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </button>

        {product.tag && (
          <span className="absolute left-2.5 top-2.5 bg-white text-[#1a0508] text-xs font-semibold px-2.5 py-0.5 rounded-sm">
            {product.tag}
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isWishlisted
              ? 'bg-[#7a001e] text-white'
              : 'bg-white text-[#1a0508] hover:text-[#7a001e]'
          }`}
        >
          <Heart
            className="w-4 h-4"
            fill={isWishlisted ? 'currentColor' : 'none'}
          />
        </button>

        <button
          type="button"
          disabled={outOfStock}
          onClick={() =>
            hasSizes ? onSelectProduct(product) : onQuickAdd(product)
          }
          className={`w-full py-2.5 px-3 text-sm font-medium transition-transform duration-200 md:absolute md:left-0 md:right-0 md:bottom-0 md:translate-y-full md:group-hover:translate-y-0 focus-visible:translate-y-0 ${
            outOfStock
              ? 'bg-[#e8d5d8] text-[#7a5c61] cursor-not-allowed'
              : 'bg-[#1a0508] text-white hover:bg-[#7a001e]'
          }`}
        >
          {outOfStock
            ? 'Out of stock'
            : hasSizes
              ? 'Select size'
              : 'Quick add'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelectProduct(product)}
        className="text-left mt-2.5 focus:outline-none"
      >
        <h3 className="font-sans text-[16px] font-semibold text-[#1a0508] leading-snug group-hover:text-[#7a001e] transition-colors">
          {product.title}
        </h3>
      </button>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#7a5c61] mt-0.5">
        <span>{product.department}</span>
        <span aria-hidden="true">·</span>
        <span>{product.categoryName}</span>
        {hasSizes && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {product.sizes.length === 1
                ? `Size ${product.sizes[0]}`
                : `${product.sizes.length} sizes`}
            </span>
          </>
        )}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-[#b3002d] font-medium">
              {product.stockQuantity} left
            </span>
          </>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2 tabular-nums">
        <span className="text-[15px] font-semibold text-[#1a0508]">
          {formatBDT(effectivePrice)}
        </span>
        {hasDiscount && (
          <s className="text-xs text-[#7a5c61] font-normal">
            {formatBDT(product.basePrice)}
          </s>
        )}
      </div>
    </article>
  );
};
