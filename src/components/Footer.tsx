import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#4a0012] text-white pt-12 pb-20">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display text-3xl">
            18 <em className="italic text-[#ffccd5]">aana</em>
          </div>
          <p className="text-white/75 text-sm mt-2 max-w-[30ch]">
            Clothing and lifestyle for the whole family. Banani, Dhaka, Bangladesh.
          </p>
        </div>

        <div>
          <h4 className="font-display text-xl mb-2.5">Shop</h4>
          <ul className="space-y-1 text-sm text-white/75">
            <li>
              <a href="#depts" className="hover:text-white">
                Men
              </a>
            </li>
            <li>
              <a href="#depts" className="hover:text-white">
                Women
              </a>
            </li>
            <li>
              <a href="#depts" className="hover:text-white">
                Kids
              </a>
            </li>
            <li>
              <a href="#winter" className="hover:text-white">
                Winter Special
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xl mb-2.5">More</h4>
          <ul className="space-y-1 text-sm text-white/75">
            <li>
              <a href="#more" className="hover:text-white">
                Bags
              </a>
            </li>
            <li>
              <a href="#more" className="hover:text-white">
                Jewellery &amp; Accessories
              </a>
            </li>
            <li>
              <a href="#more" className="hover:text-white">
                Home Decor
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xl mb-2.5">Store</h4>
          <ul className="space-y-1 text-sm text-white/75">
            <li>
              <Link to="/track" className="hover:text-white">
                Track Order
              </Link>
            </li>
            <li>
              <a href="#feedback" className="hover:text-white">
                Feedback
              </a>
            </li>
            <li>
              <Link to="/admin/products" className="hover:text-white">
                Admin Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/orders" className="hover:text-white">
                Manage Orders
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-4 border-t border-white/20 pt-4 mt-4 text-xs text-white/60">
          © 2026 18 aana. Bangladeshi clothing and lifestyle.
        </div>
      </div>
    </footer>
  );
};
