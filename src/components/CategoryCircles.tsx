import React from 'react';
import type { Category } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CategoryCirclesProps {
  categories: Category[];
  activeCategorySlug: string | null;
  onSelectCategory: (category: Category) => void;
}

export const CategoryCircles: React.FC<CategoryCirclesProps> = ({
  categories,
  activeCategorySlug,
  onSelectCategory,
}) => {
  return (
    <section className="py-12">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-end justify-between mb-6 gap-4">
          <h2 className="font-display text-[30px] sm:text-[42px] leading-tight tracking-[-0.5px] text-[#1a0508]">
            Shop by category
          </h2>
          {activeCategorySlug && (
            <button
              type="button"
              onClick={() =>
                onSelectCategory({
                  id: 0,
                  name: 'All',
                  slug: '',
                  department: 'All',
                  imageUrl: '',
                  displayOrder: 0,
                })
              }
              className="text-sm font-medium text-[#7a001e] border-b border-[#7a001e] whitespace-nowrap"
            >
              Clear category filter
            </button>
          )}
        </div>

        <div className="flex gap-6 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="shrink-0 w-[104px] text-center group focus:outline-none"
              >
                <div
                  className={`w-[104px] h-[104px] rounded-full overflow-hidden border-[3px] border-white transition-transform duration-200 group-hover:scale-105 ${
                    isActive
                      ? 'ring-2 ring-[#7a001e]'
                      : 'ring-1 ring-[#e8d5d8]'
                  }`}
                >
                  <ResilientImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className={`block mt-2.5 text-sm font-medium leading-tight ${
                    isActive ? 'text-[#7a001e] font-semibold' : 'text-[#1a0508]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
