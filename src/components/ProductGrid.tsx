import React, { useEffect, useMemo, useState } from 'react';
import { Ruler, X, Minus, Plus } from 'lucide-react';
import { formatBDT } from '../lib/images.ts';
import type { Product } from '../types/store.ts';
import { ProductCard } from './ProductCard.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  activeDepartment: string;
  activeCategorySlug: string | null;
  searchQuery: string;
  onChangeDepartment: (dept: string) => void;
  onClearFilters: () => void;
  wishlistIds: Set<number>;
  onToggleWishlist: (id: number) => void;
  onAddToCart: (product: Product, qty?: number, selectedSize?: string | null) => void;
  inspectedProduct?: Product | null;
  onCloseInspectedProduct?: () => void;
}

const TABS = ['All', 'Men', 'Women', 'Kids', 'Winter', 'Accessories'];

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  error,
  activeDepartment,
  activeCategorySlug,
  searchQuery,
  onChangeDepartment,
  onClearFilters,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  inspectedProduct,
  onCloseInspectedProduct,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [sortBy, setSortBy] = useState<
    'featured' | 'price-asc' | 'price-desc' | 'discount'
  >('featured');
  const [sizeFilter, setSizeFilter] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setShowSizeGuide(false);
    setSelectedSize(
      Array.isArray(product.sizes) && product.sizes.length > 0
        ? product.sizes[0]
        : null
    );
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setShowSizeGuide(false);
    onCloseInspectedProduct?.();
  };

  useEffect(() => {
    if (inspectedProduct) {
      openModal(inspectedProduct);
    }
  }, [inspectedProduct]);

  const availableSizeFilters = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (Array.isArray(p.sizes)) {
        for (const sz of p.sizes) set.add(sz);
      }
    }
    return Array.from(set);
  }, [products]);

  const visibleProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (inStockOnly && p.stockQuantity <= 0) return false;
      if (
        sizeFilter !== 'All' &&
        (!Array.isArray(p.sizes) || !p.sizes.includes(sizeFilter))
      ) {
        return false;
      }
      return true;
    });

    const getEffectivePrice = (p: Product) =>
      p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.basePrice;

    if (sortBy === 'price-asc') {
      return [...list].sort(
        (a, b) => getEffectivePrice(a) - getEffectivePrice(b)
      );
    }
    if (sortBy === 'price-desc') {
      return [...list].sort(
        (a, b) => getEffectivePrice(b) - getEffectivePrice(a)
      );
    }
    if (sortBy === 'discount') {
      const getSavingsRatio = (p: Product) =>
        p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.basePrice
          ? (p.basePrice - p.discountPrice) / p.basePrice
          : 0;
      return [...list].sort((a, b) => getSavingsRatio(b) - getSavingsRatio(a));
    }
    return list;
  }, [products, inStockOnly, sizeFilter, sortBy]);

  return (
    <section id="new" className="py-14">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-[32px] sm:text-[44px] leading-tight tracking-[-0.5px] text-[#1a0508]">
              New and trending
            </h2>
            {(activeCategorySlug || searchQuery.trim()) && (
              <p className="text-sm text-[#7a5c61] mt-1">
                Showing results
                {activeCategorySlug ? ` in ${activeCategorySlug.replace('-', ' ')}` : ''}
                {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ''}{' '}
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="text-[#7a001e] font-medium underline ml-1"
                >
                  Reset
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Department Filter Tabs & Sort/Size Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeDepartment === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onChangeDepartment(tab)}
                  className={`px-5 py-2 text-sm font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#7a001e] text-white border-[#7a001e]'
                      : 'bg-white text-[#1a0508] border-[#e8d5d8] hover:border-[#7a001e]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label className="inline-flex items-center gap-1.5 text-[#1a0508] cursor-pointer select-none px-2.5 py-2 border border-[#e8d5d8] rounded-sm bg-white">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#7a001e]"
              />
              <span>In stock only</span>
            </label>

            {availableSizeFilters.length > 0 && (
              <select
                aria-label="Filter by size"
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="border border-[#e8d5d8] px-3 py-2 rounded-sm bg-white text-[#1a0508] focus:outline-none focus:border-[#7a001e]"
              >
                <option value="All">All sizes</option>
                {availableSizeFilters.map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'featured'
                    | 'price-asc'
                    | 'price-desc'
                    | 'discount'
                )
              }
              className="border border-[#e8d5d8] px-3 py-2 rounded-sm bg-white text-[#1a0508] focus:outline-none focus:border-[#7a001e]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Offers first</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-5 bg-[#fcf5f6] border border-[#e8d5d8] text-[#7a001e] text-sm rounded-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#fcf5f6] rounded-sm" />
                <div className="h-4 bg-[#fcf5f6] mt-3 w-3/4 rounded-sm" />
                <div className="h-3 bg-[#fcf5f6] mt-2 w-1/2 rounded-sm" />
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-16 text-center border border-[#e8d5d8] rounded-sm bg-[#fcf5f6]">
            <p className="font-display text-2xl text-[#1a0508]">
              No matching pieces found
            </p>
            <p className="text-sm text-[#7a5c61] mt-1 mb-4">
              Try another category, size, or clear your active search filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSizeFilter('All');
                setInStockOnly(false);
                setSortBy('featured');
                onClearFilters();
              }}
              className="px-5 py-2.5 bg-[#7a001e] text-white text-sm font-medium rounded-sm hover:bg-[#4a0012]"
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4.5 gap-y-7">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
                onToggleWishlist={onToggleWishlist}
                onQuickAdd={(p) => onAddToCart(p, 1, null)}
                onSelectProduct={openModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-[#2b000a]/60 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white max-w-3xl w-full rounded-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl border border-[#e8d5d8]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.title}
          >
            <div className="aspect-[3/4] bg-[#fcf5f6]">
              <ResilientImage
                src={selectedProduct.imageUrls?.[0]}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#7a5c61] mb-1">
                      {selectedProduct.department} · {selectedProduct.categoryName}
                    </div>
                    <h3 className="font-display text-3xl text-[#1a0508] leading-tight">
                      {selectedProduct.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close product details"
                    className="p-1.5 text-[#7a5c61] hover:text-[#1a0508]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline gap-2.5 tabular-nums">
                  <span className="text-2xl font-semibold text-[#7a001e]">
                    {formatBDT(
                      selectedProduct.discountPrice &&
                        selectedProduct.discountPrice > 0
                        ? selectedProduct.discountPrice
                        : selectedProduct.basePrice
                    )}
                  </span>
                  {selectedProduct.discountPrice &&
                    selectedProduct.discountPrice > 0 &&
                    selectedProduct.discountPrice < selectedProduct.basePrice && (
                      <s className="text-sm text-[#7a5c61]">
                        {formatBDT(selectedProduct.basePrice)}
                      </s>
                    )}
                </div>

                <p className="mt-4 text-sm text-[#7a5c61] leading-relaxed">
                  {selectedProduct.description}
                </p>

                {Array.isArray(selectedProduct.sizes) &&
                  selectedProduct.sizes.length > 0 && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#1a0508]">
                          Select size
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSizeGuide((v) => !v)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7a001e] hover:underline"
                        >
                          <Ruler className="w-3 h-3" />
                          <span>{showSizeGuide ? 'Hide size guide' : 'Size guide'}</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map((size) => {
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              aria-pressed={isSelected}
                              className={`min-w-[44px] px-3 py-1.5 text-xs font-semibold border rounded-sm transition-colors ${
                                isSelected
                                  ? 'bg-[#7a001e] text-white border-[#7a001e]'
                                  : 'bg-white text-[#1a0508] border-[#e8d5d8] hover:border-[#7a001e]'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>

                      {showSizeGuide && (
                        <div className="mt-3 p-3 bg-[#fcf5f6] border border-[#e8d5d8] rounded-sm text-[11px] text-[#1a0508] tabular-nums">
                          <div className="font-semibold mb-1.5">
                            Bangladeshi Tailoring Chart (Chest / Length)
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-center border-t border-[#e8d5d8] pt-1.5">
                            <div>
                              <div className="font-semibold">S</div>
                              <div className="text-[#7a5c61]">38&quot;</div>
                            </div>
                            <div>
                              <div className="font-semibold">M</div>
                              <div className="text-[#7a5c61]">40&quot;</div>
                            </div>
                            <div>
                              <div className="font-semibold">L</div>
                              <div className="text-[#7a5c61]">42&quot;</div>
                            </div>
                            <div>
                              <div className="font-semibold">XL</div>
                              <div className="text-[#7a5c61]">44&quot;</div>
                            </div>
                            <div>
                              <div className="font-semibold">XXL</div>
                              <div className="text-[#7a5c61]">46&quot;</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                <div className="mt-5 pt-4 border-t border-[#e8d5d8] text-xs text-[#7a5c61] space-y-1">
                  <div>
                    Availability:{' '}
                    <span className="font-semibold text-[#1a0508]">
                      {selectedProduct.stockQuantity > 0
                        ? `${selectedProduct.stockQuantity} pieces in stock`
                        : 'Out of stock'}
                    </span>
                  </div>
                  <div>Delivery: Free in Dhaka over ৳2,500 · 7-day easy exchange</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#e8d5d8] flex items-center gap-3">
                <div className="inline-flex items-center border border-[#e8d5d8] rounded-sm">
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-[#1a0508] hover:bg-[#fcf5f6]"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold tabular-nums">
                    {modalQty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setModalQty((q) =>
                        Math.min(Math.max(1, selectedProduct.stockQuantity), q + 1)
                      )
                    }
                    className="p-2.5 text-[#1a0508] hover:bg-[#fcf5f6]"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={
                    selectedProduct.stockQuantity <= 0 ||
                    (Array.isArray(selectedProduct.sizes) &&
                      selectedProduct.sizes.length > 0 &&
                      !selectedSize)
                  }
                  onClick={() => {
                    const sizeToUse =
                      Array.isArray(selectedProduct.sizes) &&
                      selectedProduct.sizes.length > 0
                        ? selectedSize
                        : null;
                    onAddToCart(selectedProduct, modalQty, sizeToUse);
                    closeModal();
                  }}
                  className="flex-1 py-3 px-5 bg-[#7a001e] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] disabled:bg-[#e8d5d8] disabled:text-[#7a5c61] transition-colors"
                >
                  {selectedProduct.stockQuantity > 0
                    ? 'Add to cart'
                    : 'Out of stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
