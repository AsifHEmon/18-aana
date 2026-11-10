import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { AccountModal } from '../components/AccountModal.tsx';
import { AssistantWidget } from '../components/AssistantWidget.tsx';
import { CartDrawer } from '../components/CartDrawer.tsx';
import { CategoryCircles } from '../components/CategoryCircles.tsx';
import { DepartmentCards } from '../components/DepartmentCards.tsx';
import { FeedbackSection } from '../components/FeedbackSection.tsx';
import { Footer } from '../components/Footer.tsx';
import { Header } from '../components/Header.tsx';
import { Hero } from '../components/Hero.tsx';
import { ProductGrid } from '../components/ProductGrid.tsx';
import { TrustAndFinishLook } from '../components/TrustAndFinishLook.tsx';
import { WinterSpecial } from '../components/WinterSpecial.tsx';
import { WishlistDrawer } from '../components/WishlistDrawer.tsx';
import { safeParseJson } from '../lib/api.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import type { CartItem, Category, FeedbackItem, Product } from '../types/store.ts';

const CART_STORAGE_KEY = '18aana_cart_v1';
const WISHLIST_STORAGE_KEY = '18aana_wishlist_v1';

function loadStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStoredWishlist(): Set<number> {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.map(Number).filter((n) => Number.isInteger(n) && n > 0))
      : new Set();
  } catch {
    return new Set();
  }
}

export const StorefrontPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDepartment, setActiveDepartment] = useState('All');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState<CartItem[]>(loadStoredCart);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(loadStoredWishlist);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(Array.from(wishlistIds))
      );
    } catch {
      // ignore storage quota errors
    }
  }, [wishlistIds]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes, fbRes] = await Promise.all([
        fetch('/api/categories', { credentials: 'include' }),
        fetch('/api/products', { credentials: 'include' }),
        fetch('/api/feedback', { credentials: 'include' }),
      ]);

      const [catData, prodData] = await Promise.all([
        safeParseJson<Category[]>(catRes),
        safeParseJson<Product[]>(prodRes),
      ]);
      const fbData = fbRes.ok ? await safeParseJson<FeedbackItem[]>(fbRes) : [];

      setCategories(catData);
      setProducts(prodData);
      setFeedbacks(fbData);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to connect to store server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          await fetch('/api/auth/sync', {
            method: 'POST',
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // ignore silent background sync errors
        }
      }
    });
    return () => unsub();
  }, []);

  const getAuthToken = useCallback(async () => {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  const handleGoogleSignIn = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        activeDepartment !== 'All' &&
        p.department.toLowerCase() !== activeDepartment.toLowerCase()
      ) {
        return false;
      }
      if (
        activeCategorySlug &&
        p.categorySlug.toLowerCase() !== activeCategorySlug.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${p.title} ${p.description} ${p.department} ${p.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, activeDepartment, activeCategorySlug, searchQuery]);

  const handleSelectFilter = (department: string, categorySlug?: string) => {
    setActiveDepartment(department || 'All');
    setActiveCategorySlug(categorySlug || null);
  };

  const handleSelectCategory = (cat: Category) => {
    if (!cat.slug) {
      setActiveCategorySlug(null);
      setActiveDepartment('All');
      return;
    }
    setActiveDepartment('All');
    setActiveCategorySlug(cat.slug);
  };

  const handleClearFilters = () => {
    setActiveDepartment('All');
    setActiveCategorySlug(null);
    setSearchQuery('');
  };

  const handleAddToCart = (
    product: Product,
    qty = 1,
    selectedSize: string | null = null
  ) => {
    if (product.stockQuantity <= 0) return;
    const normalizedSize = selectedSize?.trim() || null;
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.product.id === product.id &&
          (i.selectedSize ?? null) === normalizedSize
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id &&
          (i.selectedSize ?? null) === normalizedSize
            ? {
                ...i,
                quantity: Math.min(product.stockQuantity, i.quantity + qty),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          selectedSize: normalizedSize,
          quantity: Math.min(product.stockQuantity, qty),
        },
      ];
    });
    setCartOpen(true);
  };

  const handleUpdateCartQty = (
    productId: number,
    selectedSize: string | null,
    quantity: number
  ) => {
    const normalizedSize = selectedSize ?? null;
    if (quantity <= 0) {
      setCart((prev) =>
        prev.filter(
          (i) =>
            !(
              i.product.id === productId &&
              (i.selectedSize ?? null) === normalizedSize
            )
        )
      );
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId &&
        (i.selectedSize ?? null) === normalizedSize
          ? { ...i, quantity }
          : i
      )
    );
  };

  const handleRemoveCartItem = (
    productId: number,
    selectedSize: string | null
  ) => {
    const normalizedSize = selectedSize ?? null;
    setCart((prev) =>
      prev.filter(
        (i) =>
          !(
            i.product.id === productId &&
            (i.selectedSize ?? null) === normalizedSize
          )
      )
    );
  };

  const handleToggleWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistedProducts = useMemo(
    () => products.filter((p) => wishlistIds.has(p.id)),
    [products, wishlistIds]
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-white text-[#1a0508]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectFilter={handleSelectFilter}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.size}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        userEmail={firebaseUser?.email ?? null}
      />

      <main className="flex-1">
        <Hero />

        <CategoryCircles
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          onSelectCategory={handleSelectCategory}
        />

        <DepartmentCards onSelectDepartment={handleSelectFilter} />

        <WinterSpecial
          onSelectWinter={(slug) =>
            handleSelectFilter(slug ? 'All' : 'Winter', slug)
          }
        />

        <ProductGrid
          products={filteredProducts}
          loading={loading}
          error={error}
          activeDepartment={activeDepartment}
          activeCategorySlug={activeCategorySlug}
          searchQuery={searchQuery}
          onChangeDepartment={(dept) => {
            setActiveDepartment(dept);
            setActiveCategorySlug(null);
          }}
          onClearFilters={handleClearFilters}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          inspectedProduct={inspectedProduct}
          onCloseInspectedProduct={() => setInspectedProduct(null)}
        />

        <TrustAndFinishLook
          onSelectCategorySlug={(slug) => handleSelectFilter('All', slug)}
        />

        <FeedbackSection
          feedbacks={feedbacks}
          onFeedbackSubmitted={(item) =>
            setFeedbacks((prev) => [item, ...prev])
          }
        />
      </main>

      <Footer />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
        onOrderCompleted={loadCatalog}
        getAuthToken={getAuthToken}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        items={wishlistedProducts}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1, null)}
        onInspectProduct={(p) => setInspectedProduct(p)}
      />

      <AccountModal
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        userEmail={firebaseUser?.email ?? null}
        userName={firebaseUser?.displayName ?? null}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        getAuthToken={getAuthToken}
      />

      <AssistantWidget
        products={products}
        onInspectProduct={(p) => setInspectedProduct(p)}
      />
    </div>
  );
};
