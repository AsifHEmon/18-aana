import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LogOut,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { safeParseJson } from '../lib/api.ts';
import { formatBDT } from '../lib/images.ts';
import type { AdminUser, Category, OrderRecord, Product } from '../types/store.ts';

interface ProductFormState {
  id?: number;
  title: string;
  categoryId: number;
  department: string;
  basePrice: string;
  discountPrice: string;
  tag: string;
  stockQuantity: string;
  description: string;
  imageUrls: string[];
  sizes: string[];
  isFeatured: boolean;
}

const DEPARTMENTS = ['Men', 'Women', 'Kids', 'Winter', 'Accessories'];
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: 'products' | 'orders' = location.pathname.includes('/orders')
    ? 'orders'
    : 'products';

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  // Catalog & Orders State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draftingCopy, setDraftingCopy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [form, setForm] = useState<ProductFormState>({
    title: '',
    categoryId: 1,
    department: 'Men',
    basePrice: '',
    discountPrice: '',
    tag: '',
    stockQuantity: '10',
    description: '',
    imageUrls: ['punjabi'],
    sizes: [],
    isFeatured: true,
  });

  const checkAdminSession = useCallback(async () => {
    setAuthChecking(true);
    try {
      const res = await fetch('/api/admin/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await safeParseJson<{ admin: AdminUser }>(res);
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  const loadCategories = useCallback(async () => {
    try {
      const catRes = await fetch('/api/categories', { credentials: 'include' });
      if (catRes.ok) {
        const catData = await safeParseJson<Category[]>(catRes);
        setCategories(catData);
      }
    } catch {
      // handled when loading full dashboard data
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadAdminData = useCallback(async () => {
    if (!admin) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const [catRes, prodRes, ordRes] = await Promise.all([
        fetch('/api/categories', { credentials: 'include' }),
        fetch('/api/admin/products', { credentials: 'include' }),
        fetch('/api/admin/orders', { credentials: 'include' }),
      ]);

      if (catRes.ok) {
        const catData = await safeParseJson<Category[]>(catRes);
        setCategories(catData);
      }

      if (prodRes.status === 401 || ordRes.status === 401) {
        setAdmin(null);
        setLoginError('Admin session expired or missing. Please sign in again.');
        return;
      }

      const [prodData, ordData] = await Promise.all([
        safeParseJson<Product[]>(prodRes),
        safeParseJson<OrderRecord[]>(ordRes),
      ]);
      setProducts(prodData);
      setOrders(ordData);
    } catch (err: unknown) {
      setDataError(
        err instanceof Error ? err.message : 'Unable to load admin data.'
      );
    } finally {
      setLoadingData(false);
    }
  }, [admin]);

  useEffect(() => {
    if (admin) {
      loadAdminData();
    }
  }, [admin, loadAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginPending(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await safeParseJson<{ admin: AdminUser }>(res);
      setAdmin(data.admin);
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : 'Unable to sign in.'
      );
    } finally {
      setLoginPending(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    setAdmin(null);
    setLoginPassword('');
  };

  const openAddModal = () => {
    const firstCat = categories[0];
    setForm({
      title: '',
      categoryId: firstCat?.id ?? 1,
      department: firstCat?.department ?? 'Men',
      basePrice: '',
      discountPrice: '',
      tag: 'New',
      stockQuantity: '15',
      description: '',
      imageUrls: [firstCat?.imageUrl || 'punjabi'],
      sizes: [],
      isFeatured: true,
    });
    setCustomSizeInput('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setForm({
      id: p.id,
      title: p.title,
      categoryId: p.categoryId,
      department: p.department,
      basePrice: String(p.basePrice),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      tag: p.tag ?? '',
      stockQuantity: String(p.stockQuantity),
      description: p.description,
      imageUrls: p.imageUrls.length > 0 ? p.imageUrls : ['punjabi'],
      sizes: Array.isArray(p.sizes) ? [...p.sizes] : [],
      isFeatured: p.isFeatured,
    });
    setCustomSizeInput('');
    setFormError(null);
    setModalOpen(true);
  };

  const toggleFormSize = (size: string) => {
    setForm((prev) => {
      const exists = prev.sizes.includes(size);
      const next = exists
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: next };
    });
  };

  const handleAddCustomSize = () => {
    const cleaned = customSizeInput.trim();
    if (!cleaned) return;
    setForm((prev) => {
      if (prev.sizes.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      return { ...prev, sizes: [...prev.sizes, cleaned] };
    });
    setCustomSizeInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: fd,
      });
      const data = await safeParseJson<{ url: string }>(res);
      setForm((prev) => ({
        ...prev,
        imageUrls: [data.url, ...prev.imageUrls.filter((u) => u !== data.url)],
      }));
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to upload image.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    setFormError(null);

    try {
      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `/api/admin/products/${form.id}`
        : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          title: form.title,
          categoryId: Number(form.categoryId),
          department: form.department,
          basePrice: Number(form.basePrice),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
          tag: form.tag.trim() || null,
          stockQuantity: Number(form.stockQuantity),
          description: form.description,
          imageUrls: form.imageUrls,
          sizes: form.sizes,
          isFeatured: form.isFeatured,
        }),
      });

      await safeParseJson(res);
      setModalOpen(false);
      await loadAdminData();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save product.'
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setDataError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      await safeParseJson(res);
      await loadAdminData();
    } catch (err: unknown) {
      setDataError(
        err instanceof Error ? err.message : 'Unable to delete product.'
      );
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    status: OrderRecord['status']
  ) => {
    setDataError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ status }),
      });
      await safeParseJson(res);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err: unknown) {
      setDataError(
        err instanceof Error ? err.message : 'Could not update order status.'
      );
    }
  };

  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stockQuantity + delta);
    if (nextStock === product.stockQuantity) return;
    setDataError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ stockQuantity: nextStock }),
      });
      await safeParseJson(res);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stockQuantity: nextStock } : p
        )
      );
    } catch (err: unknown) {
      setDataError(
        err instanceof Error ? err.message : 'Could not update stock.'
      );
    }
  };

  const handleDraftDescription = async () => {
    if (!form.title.trim()) {
      setFormError('Enter a product title first so AI can draft a description.');
      return;
    }
    setDraftingCopy(true);
    setFormError(null);
    try {
      const catName =
        categories.find((c) => c.id === Number(form.categoryId))?.name ??
        form.department;
      const res = await fetch('/api/admin/ai-copy', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          title: form.title,
          department: form.department,
          categoryName: catName,
          sizes: form.sizes,
          tag: form.tag.trim() || null,
        }),
      });
      const data = await safeParseJson<{ description: string }>(res);
      setForm((prev) => ({ ...prev, description: data.description }));
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to draft description.'
      );
    } finally {
      setDraftingCopy(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (deptFilter !== 'All' && p.department !== deptFilter) return false;
      if (catFilter !== 'All' && String(p.categoryId) !== catFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${p.title} ${p.categoryName} ${p.department}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, deptFilter, catFilter, searchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (orderStatusFilter !== 'All' && ord.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase().replace(/^#/, '');
        const itemsText = ord.items.map((it) => it.productTitle).join(' ');
        const hay =
          `${ord.orderNumber} ${ord.customerName} ${ord.phone} ${ord.city} ${itemsText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const orderRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Pending').length,
    [orders]
  );
  const deliveredOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Delivered').length,
    [orders]
  );

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#fcf5f6] flex items-center justify-center text-sm text-[#7a5c61]">
        Verifying admin session...
      </div>
    );
  }

  // Unauthenticated Admin Login Screen
  if (!admin) {
    return (
      <div className="min-h-screen bg-[#fcf5f6] flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-white border border-[#e8d5d8] rounded-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <BrandMark size={38} />
            <div>
              <h1 className="font-display text-2xl text-[#1a0508] leading-none">
                18 <em className="italic text-[#b3002d]">aana</em> Admin
              </h1>
              <p className="text-xs text-[#7a5c61] mt-1">
                Protected store inventory &amp; order console
              </p>
            </div>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mb-4 p-3 bg-[#fcf5f6] border border-[#b3002d] text-xs text-[#7a001e] rounded-sm"
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                Admin email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@18aana.com"
                className="w-full border border-[#e8d5d8] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a0508] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-[#e8d5d8] px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
              />
            </div>

            <button
              type="submit"
              disabled={loginPending}
              className="w-full py-2.5 px-4 bg-[#7a001e] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] disabled:opacity-60 transition-colors"
            >
              {loginPending ? 'Signing in...' : 'Sign in to dashboard'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#e8d5d8] flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setLoginEmail('admin@18aana.com');
                setLoginPassword('Admin@18aana2026');
              }}
              className="text-[#7a001e] font-medium hover:underline"
            >
              Fill default admin credentials
            </button>
            <Link to="/" className="text-[#7a5c61] hover:text-[#1a0508]">
              Back to storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lowStockCount = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= 5
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <div className="min-h-screen bg-[#fcf5f6] flex flex-col lg:flex-row text-[#1a0508]">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#e8d5d8] flex flex-col justify-between shrink-0">
        <div className="p-5">
          <div className="flex items-center gap-2.5 pb-5 border-b border-[#e8d5d8]">
            <BrandMark size={34} />
            <span className="font-display text-2xl leading-none">
              18 <em className="italic text-[#b3002d]">aana</em>
            </span>
          </div>

          <nav className="mt-5 flex lg:flex-col gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-sm transition-colors text-left ${
                activeTab === 'products'
                  ? 'bg-[#7a001e] text-white'
                  : 'text-[#1a0508] hover:bg-[#fcf5f6]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Products</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-sm transition-colors text-left ${
                activeTab === 'orders'
                  ? 'bg-[#7a001e] text-white'
                  : 'text-[#1a0508] hover:bg-[#fcf5f6]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders</span>
              <span className="ml-auto text-xs tabular-nums opacity-80">
                {orders.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-5 border-t border-[#e8d5d8] space-y-3">
          <div className="text-xs">
            <div className="font-semibold text-[#1a0508] truncate">
              {admin.name}
            </div>
            <div className="text-[#7a5c61] truncate">{admin.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#e8d5d8] rounded-sm hover:border-[#1a0508]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium border border-[#e8d5d8] text-[#7a001e] rounded-sm hover:bg-[#fcf5f6]"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e8d5d8] px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-sm text-[#7a5c61]">
            <span>18 aana Admin</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-[#1a0508]">
              {activeTab === 'products' ? 'Products' : 'Orders'}
            </span>
          </div>

          {activeTab === 'products' && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7a001e] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </header>

        <main className="p-6 space-y-5 flex-1">
          {dataError && (
            <div
              role="alert"
              className="p-3.5 bg-white border border-[#b3002d] text-sm text-[#7a001e] rounded-sm"
            >
              {dataError}
            </div>
          )}

          {activeTab === 'products' ? (
            <>
              {/* Summary Strip */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm">
                  <div className="text-xs text-[#7a5c61]">Total Products</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1">
                    {products.length}
                  </div>
                </div>
                <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm">
                  <div className="text-xs text-[#7a5c61]">Low Stock (≤ 5)</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1 text-[#b45309]">
                    {lowStockCount}
                  </div>
                </div>
                <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm">
                  <div className="text-xs text-[#7a5c61]">Out of Stock</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1 text-[#7a001e]">
                    {outOfStockCount}
                  </div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#7a5c61] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by title, category..."
                    className="w-full border border-[#e8d5d8] pl-9 pr-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                  />
                </div>

                <select
                  aria-label="Filter by department"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm bg-white focus:outline-none focus:border-[#7a001e]"
                >
                  <option value="All">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by category"
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm bg-white focus:outline-none focus:border-[#7a001e]"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Data Table */}
              <div className="bg-white border border-[#e8d5d8] rounded-sm overflow-x-auto">
                {loadingData ? (
                  <div className="p-8 text-sm text-[#7a5c61]">
                    Loading products...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="font-display text-xl text-[#1a0508]">
                      No products match your filters
                    </p>
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="mt-3 px-4 py-2 bg-[#7a001e] text-white text-xs font-semibold rounded-sm"
                    >
                      Add first product
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#e8d5d8] bg-[#fcf5f6] text-xs font-semibold text-[#7a5c61]">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4">Tag</th>
                        <th className="py-3 px-4 text-right">Stock</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8d5d8]">
                      {filteredProducts.map((p) => {
                        const stockStatus =
                          p.stockQuantity <= 0
                            ? 'Out of stock'
                            : p.stockQuantity <= 5
                              ? 'Low stock'
                              : 'In stock';
                        return (
                          <tr key={p.id} className="hover:bg-[#fcf5f6]/60">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-13 rounded-sm overflow-hidden bg-[#fcf5f6] shrink-0">
                                  <ResilientImage
                                    src={p.imageUrls?.[0]}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#1a0508] truncate">
                                    {p.title}
                                  </div>
                                  <div className="text-xs text-[#7a5c61] font-mono truncate">
                                    {p.slug}
                                    {p.sizes && p.sizes.length > 0
                                      ? ` · Sizes: ${p.sizes.join(', ')}`
                                      : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#7a5c61]">
                              <span className="text-[#1a0508] font-medium">
                                {p.categoryName}
                              </span>
                              {' · '}
                              <span>{p.department}</span>
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {p.discountPrice ? (
                                <div>
                                  <span className="font-semibold text-[#7a001e]">
                                    {formatBDT(p.discountPrice)}
                                  </span>
                                  <span className="block text-xs text-[#7a5c61] line-through">
                                    {formatBDT(p.basePrice)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-semibold text-[#1a0508]">
                                  {formatBDT(p.basePrice)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#7a5c61]">
                              {p.tag || '—'}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={p.stockQuantity <= 0}
                                  onClick={() => handleQuickAdjustStock(p, -1)}
                                  aria-label={`Decrease stock for ${p.title}`}
                                  className="p-1 border border-[#e8d5d8] rounded-sm text-[#7a5c61] hover:border-[#7a001e] hover:text-[#7a001e] disabled:opacity-40"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="min-w-[24px] text-center font-semibold text-[#1a0508]">
                                  {p.stockQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjustStock(p, 1)}
                                  aria-label={`Increase stock for ${p.title}`}
                                  className="p-1 border border-[#e8d5d8] rounded-sm text-[#7a5c61] hover:border-[#7a001e] hover:text-[#7a001e]"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div
                                className={`text-[11px] font-medium mt-0.5 ${
                                  p.stockQuantity <= 0
                                    ? 'text-[#b3002d]'
                                    : p.stockQuantity <= 5
                                      ? 'text-[#b45309]'
                                      : 'text-[#15803d]'
                                }`}
                              >
                                {stockStatus}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(p)}
                                  className="p-1.5 border border-[#e8d5d8] rounded-sm text-[#1a0508] hover:border-[#7a001e] hover:text-[#7a001e]"
                                  aria-label={`Edit ${p.title}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p)}
                                  className="p-1.5 border border-[#e8d5d8] rounded-sm text-[#7a5c61] hover:border-[#b3002d] hover:text-[#b3002d]"
                                  aria-label={`Delete ${p.title}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Orders Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm">
                  <div className="text-xs text-[#7a5c61]">Active Revenue</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1 text-[#7a001e]">
                    {formatBDT(orderRevenue)}
                  </div>
                </div>
                <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm">
                  <div className="text-xs text-[#7a5c61]">Pending Dispatch</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1 text-[#b45309]">
                    {pendingOrdersCount}
                  </div>
                </div>
                <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm">
                  <div className="text-xs text-[#7a5c61]">Delivered</div>
                  <div className="text-2xl font-semibold tabular-nums mt-1 text-[#15803d]">
                    {deliveredOrdersCount}
                  </div>
                </div>
              </div>

              {/* Orders Filter Toolbar */}
              <div className="bg-white border border-[#e8d5d8] p-4 rounded-sm flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#7a5c61] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by order #18A-..., customer, phone..."
                    className="w-full border border-[#e8d5d8] pl-9 pr-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                  />
                </div>

                <select
                  aria-label="Filter orders by status"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm bg-white focus:outline-none focus:border-[#7a001e]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-[#e8d5d8] rounded-sm overflow-x-auto">
                {loadingData ? (
                  <div className="p-8 text-sm text-[#7a5c61]">
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#7a5c61]">
                    {orders.length === 0
                      ? 'No customer orders placed yet.'
                      : 'No orders match your search or status filter.'}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#e8d5d8] bg-[#fcf5f6] text-xs font-semibold text-[#7a5c61]">
                        <th className="py-3 px-4">Order</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Delivery</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8d5d8]">
                      {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#fcf5f6]/60">
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs font-semibold text-[#7a001e]">
                            #{ord.orderNumber}
                          </div>
                          <div className="text-xs text-[#7a5c61] mt-0.5">
                            {ord.items
                              .map((it) =>
                                it.selectedSize
                                  ? `${it.quantity}× ${it.productTitle} (${it.selectedSize})`
                                  : `${it.quantity}× ${it.productTitle}`
                              )
                              .join(', ')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1a0508]">
                            {ord.customerName}
                          </div>
                          <div className="text-xs text-[#7a5c61] tabular-nums">
                            {ord.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#7a5c61] max-w-[240px]">
                          <span className="font-medium text-[#1a0508]">
                            {ord.city}
                          </span>
                          {' · '}
                          <span className="line-clamp-1">
                            {ord.deliveryAddress}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-[#1a0508]">
                            {ord.paymentMethod}
                          </div>
                          {ord.paymentReference && (
                            <span className="block text-[#7a5c61] font-mono mt-0.5">
                              TrxID: {ord.paymentReference}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatBDT(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Order ${ord.orderNumber} status`}
                            value={ord.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(
                                ord.id,
                                e.target.value as OrderRecord['status']
                              )
                            }
                            className="border border-[#e8d5d8] px-2.5 py-1 text-xs font-medium rounded-sm bg-white focus:outline-none focus:border-[#7a001e]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#2b000a]/60 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white max-w-xl w-full rounded-sm border border-[#e8d5d8] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={form.id ? 'Edit product' : 'Add new product'}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8d5d8]">
              <h2 className="font-display text-2xl text-[#1a0508]">
                {form.id ? 'Edit product' : 'Add new product'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-[#7a5c61] hover:text-[#1a0508]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            >
              {formError && (
                <div
                  role="alert"
                  className="p-3 bg-[#fcf5f6] border border-[#b3002d] text-xs text-[#7a001e] rounded-sm"
                >
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Product title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Jamdani Cotton Kurti"
                  className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => {
                      const nextDept = e.target.value;
                      const matchingCat = categories.find(
                        (c) => c.department === nextDept
                      );
                      setForm({
                        ...form,
                        department: nextDept,
                        ...(matchingCat ? { categoryId: matchingCat.id } : {}),
                      });
                    }}
                    className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm bg-white focus:outline-none focus:border-[#7a001e]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => {
                      const nextCatId = Number(e.target.value);
                      const chosen = categories.find((c) => c.id === nextCatId);
                      setForm({
                        ...form,
                        categoryId: nextCatId,
                        ...(chosen ? { department: chosen.department } : {}),
                      });
                    }}
                    className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm bg-white focus:outline-none focus:border-[#7a001e]"
                  >
                    {categories.length === 0 ? (
                      <option value="">Loading categories...</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.department})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Base price (৳)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm({ ...form, basePrice: e.target.value })
                    }
                    className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm tabular-nums focus:outline-none focus:border-[#7a001e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Discount price (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.discountPrice}
                    onChange={(e) =>
                      setForm({ ...form, discountPrice: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm tabular-nums focus:outline-none focus:border-[#7a001e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Stock qty
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.stockQuantity}
                    onChange={(e) =>
                      setForm({ ...form, stockQuantity: e.target.value })
                    }
                    className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm tabular-nums focus:outline-none focus:border-[#7a001e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Tag (optional)
                  </label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="New or -15%"
                    className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                    className="accent-[#7a001e]"
                  />
                  <span>Feature in New &amp; Trending</span>
                </label>
              </div>

              {/* Optional Product Sizes */}
              <div className="p-3.5 bg-[#fcf5f6] border border-[#e8d5d8] rounded-sm space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a0508]">
                      Product sizes (optional)
                    </label>
                    <p className="text-[11px] text-[#7a5c61]">
                      Select sizes for apparel, or leave empty for one-size items like Sharee, Bags, or Home Decor.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                        }))
                      }
                      className="text-[#7a001e] font-semibold hover:underline"
                    >
                      Select S–XXL
                    </button>
                    <span className="text-[#e8d5d8]" aria-hidden="true">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, sizes: [] }))}
                      className="text-[#7a5c61] font-medium hover:text-[#1a0508]"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SIZES.map((sz) => {
                    const active = form.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleFormSize(sz)}
                        aria-pressed={active}
                        className={`px-3 py-1.5 text-xs font-semibold border rounded-sm transition-colors ${
                          active
                            ? 'bg-[#7a001e] text-white border-[#7a001e]'
                            : 'bg-white text-[#1a0508] border-[#e8d5d8] hover:border-[#7a001e]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                  {form.sizes
                    .filter((sz) => !PRESET_SIZES.includes(sz))
                    .map((customSz) => (
                      <button
                        key={customSz}
                        type="button"
                        onClick={() => toggleFormSize(customSz)}
                        title="Click to remove size"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-sm bg-[#7a001e] text-white border-[#7a001e]"
                      >
                        <span>{customSz}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    placeholder="Add custom size (e.g. 2-3Y, 40, Free Size)"
                    className="flex-1 bg-white border border-[#e8d5d8] px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:border-[#7a001e]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-1.5 bg-white border border-[#e8d5d8] text-xs font-semibold text-[#1a0508] rounded-sm hover:border-[#7a001e] hover:text-[#7a001e]"
                  >
                    Add size
                  </button>
                </div>

                <div className="text-[11px] text-[#7a5c61]">
                  {form.sizes.length > 0 ? (
                    <>
                      Active sizes:{' '}
                      <span className="font-semibold text-[#1a0508]">
                        {form.sizes.join(', ')}
                      </span>
                    </>
                  ) : (
                    'No sizes required — customers can add directly to cart.'
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold">
                    Description
                  </label>
                  <button
                    type="button"
                    disabled={draftingCopy}
                    onClick={handleDraftDescription}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7a001e] hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {draftingCopy ? 'Drafting...' : 'Draft with AI'}
                    </span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Fabric, weave, tailoring and care details..."
                  className="w-full border border-[#e8d5d8] px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#7a001e]"
                />
              </div>

              {/* Image Uploader */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Product image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-sm overflow-hidden bg-[#fcf5f6] border border-[#e8d5d8] shrink-0">
                    <ResilientImage
                      src={form.imageUrls[0]}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#e8d5d8] rounded-sm text-xs font-semibold cursor-pointer hover:border-[#7a001e]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingImage ? 'Uploading...' : 'Upload image file'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="text"
                      value={form.imageUrls[0] || ''}
                      onChange={(e) =>
                        setForm({ ...form, imageUrls: [e.target.value] })
                      }
                      placeholder="Image key or uploaded URL"
                      className="w-full border border-[#e8d5d8] px-2.5 py-1.5 text-xs rounded-sm font-mono focus:outline-none focus:border-[#7a001e]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e8d5d8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#e8d5d8] text-sm font-medium rounded-sm hover:border-[#1a0508]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="px-5 py-2 bg-[#7a001e] text-white text-sm font-semibold rounded-sm hover:bg-[#4a0012] disabled:opacity-60"
                >
                  {savingProduct
                    ? 'Saving...'
                    : form.id
                      ? 'Save changes'
                      : 'Create product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
