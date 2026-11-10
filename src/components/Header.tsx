import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User, ShieldCheck } from 'lucide-react';
import { BrandMark } from './BrandMark.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectFilter: (department: string, categorySlug?: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  userEmail?: string | null;
}

const MEGA_MENUS: Array<{
  label: string;
  department: string;
  items: Array<{ name: string; slug?: string }>;
  promoKey: string;
}> = [
  {
    label: 'Men',
    department: 'Men',
    items: [
      { name: 'Punjabi', slug: 'punjabi' },
      { name: 'Casual Shirt', slug: 'casual-shirt' },
      { name: 'Fatua', slug: 'fatua' },
      { name: 'Winter Flannel', slug: 'flannel' },
    ],
    promoKey: 'punjabi',
  },
  {
    label: 'Women',
    department: 'Women',
    items: [
      { name: 'Sharee', slug: 'sharee' },
      { name: 'Kurti', slug: 'kurti' },
      { name: 'Three-piece', slug: 'three-piece' },
      { name: 'Salwar', slug: 'salwar' },
    ],
    promoKey: 'sharee',
  },
  {
    label: 'Kids',
    department: 'Kids',
    items: [
      { name: 'Fatua Set', slug: 'fatua' },
      { name: 'Festive Boys' },
      { name: 'Festive Girls' },
    ],
    promoKey: 'fatua',
  },
  {
    label: 'Winter Special',
    department: 'Winter',
    items: [
      { name: 'Wool Shawl', slug: 'shawl' },
      { name: 'Flannel Shirt', slug: 'flannel' },
    ],
    promoKey: 'shawl',
  },
];

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSelectFilter,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  userEmail,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleNavClick = (department: string, slug?: string) => {
    setOpenMenu(null);
    onSelectFilter(department, slug);
    const el = document.getElementById('new');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-[#7a001e] text-white text-[13px] py-1.5">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between gap-4">
          <span>Free delivery in Dhaka on orders above ৳2,500</span>
          <span className="hidden sm:inline">Cash on delivery · 7-day easy returns</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 bg-white border-b border-[#e8d5d8]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center py-3 gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative w-full max-w-[260px]">
                <Search className="w-4 h-4 text-[#7a5c61] absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  placeholder="Search punjabi, sharee, shawl"
                  aria-label="Search products"
                  className="w-full border-0 border-b-[1.5px] border-[#1a0508] bg-transparent pl-6 pr-2 py-1.5 text-sm text-[#1a0508] placeholder:text-[#7a5c61] focus:outline-none focus:border-[#7a001e]"
                />
              </div>
            </div>

            {/* Brand Mark & Wordmark */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 whitespace-nowrap shrink-0 justify-self-start md:justify-self-center"
              aria-label="18 aana home"
            >
              <BrandMark size={40} />
              <span className="font-display text-[28px] md:text-[32px] leading-none tracking-[-0.5px] text-[#1a0508]">
                18 <em className="italic text-[#b3002d]">aana</em>
              </span>
            </a>

            {/* Action Icons */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenAccount}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap shrink-0"
                title={userEmail ? `Signed in as ${userEmail}` : 'Account & Order Tracking'}
              >
                <User className="w-4 h-4" />
                <span>{userEmail ? 'Orders' : 'Account'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenWishlist}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-2 text-sm font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap shrink-0"
                aria-label={`Open wishlist (${wishlistCount})`}
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Wishlist</span>
                <span className="tabular-nums text-xs font-semibold text-[#7a001e]">
                  ({wishlistCount})
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#7a001e] text-white rounded-sm hover:bg-[#4a0012] transition-colors whitespace-nowrap shrink-0"
                aria-label={`Open cart with ${cartCount} items`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cart</span>
                <span className="tabular-nums text-xs bg-white/20 px-1.5 py-0.5 rounded-sm">
                  {cartCount}
                </span>
              </button>

              <Link
                to="/admin/products"
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-[#7a5c61] hover:text-[#7a001e] transition-colors whitespace-nowrap shrink-0"
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-2.5">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#7a5c61] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    document
                      .getElementById('new')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                placeholder="Search punjabi, sharee, shawl..."
                aria-label="Search products on mobile"
                className="w-full border border-[#e8d5d8] bg-[#fcf5f6] pl-8 pr-3 py-1.5 text-sm rounded-sm text-[#1a0508] placeholder:text-[#7a5c61] focus:outline-none focus:border-[#7a001e]"
              />
            </div>
          </div>

          {/* Navigation Row */}
          <nav
            aria-label="Main navigation"
            className="relative"
            onMouseLeave={() => setOpenMenu(null)}
          >
            <ul className="flex items-center justify-start lg:justify-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {MEGA_MENUS.map((menu) => (
                <li
                  key={menu.label}
                  className="shrink-0"
                  onMouseEnter={() => setOpenMenu(menu.label)}
                >
                  <button
                    type="button"
                    onClick={() => handleNavClick(menu.department)}
                    className="relative px-3.5 py-2.5 text-[15px] font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap shrink-0 group"
                  >
                    {menu.label}
                    <span className="absolute left-3.5 right-3.5 bottom-1 h-[2px] bg-[#7a001e] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </button>

                  {openMenu === menu.label && (
                    <div className="hidden lg:block absolute left-0 right-0 top-full bg-white border-y border-[#e8d5d8] shadow-[0_18px_30px_rgba(122,0,30,0.08)] z-40">
                      <div className="max-w-[1280px] mx-auto px-6 py-7 grid grid-cols-3 gap-8">
                        <div>
                          <h4 className="font-display text-2xl text-[#1a0508] mb-3">
                            {menu.label}
                          </h4>
                          <ul className="space-y-1.5">
                            {menu.items.slice(0, Math.ceil(menu.items.length / 2)).map((sub) => (
                              <li key={sub.name}>
                                <button
                                  type="button"
                                  onClick={() => handleNavClick(menu.department, sub.slug)}
                                  className="text-sm text-[#7a5c61] hover:text-[#7a001e] transition-colors"
                                >
                                  {sub.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-display text-2xl text-transparent select-none mb-3">
                            More
                          </h4>
                          <ul className="space-y-1.5">
                            {menu.items.slice(Math.ceil(menu.items.length / 2)).map((sub) => (
                              <li key={sub.name}>
                                <button
                                  type="button"
                                  onClick={() => handleNavClick(menu.department, sub.slug)}
                                  className="text-sm text-[#7a5c61] hover:text-[#7a001e] transition-colors"
                                >
                                  {sub.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavClick(menu.department)}
                          className="relative h-56 rounded-sm overflow-hidden group text-left"
                        >
                          <ResilientImage
                            src={menu.promoKey}
                            alt={`New in ${menu.label}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#4a0012]/70 via-transparent to-transparent" />
                          <span className="absolute bottom-4 left-4 bg-white text-[#1a0508] px-3 py-1 font-display text-lg rounded-sm">
                            New in {menu.label.toLowerCase()}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}

              <li className="shrink-0">
                <a
                  href="#more"
                  className="block px-3.5 py-2.5 text-[15px] font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap"
                >
                  Bags
                </a>
              </li>
              <li className="shrink-0">
                <a
                  href="#more"
                  className="block px-3.5 py-2.5 text-[15px] font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap"
                >
                  Jewellery &amp; Accessories
                </a>
              </li>
              <li className="shrink-0">
                <a
                  href="#more"
                  className="block px-3.5 py-2.5 text-[15px] font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap"
                >
                  Home Decor
                </a>
              </li>
              <li className="shrink-0">
                <a
                  href="#feedback"
                  className="block px-3.5 py-2.5 text-[15px] font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap"
                >
                  Feedback
                </a>
              </li>
              <li className="shrink-0">
                <Link
                  to="/track"
                  className="block px-3.5 py-2.5 text-[15px] font-medium text-[#1a0508] hover:text-[#7a001e] transition-colors whitespace-nowrap"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};
