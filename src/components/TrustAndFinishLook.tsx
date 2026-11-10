import React from 'react';
import { ResilientImage } from './ResilientImage.tsx';

interface TrustAndFinishLookProps {
  onSelectCategorySlug: (slug: string) => void;
}

const LIFESTYLE_TILES = [
  {
    title: 'Bags',
    subtitle: 'Totes, handbags, backpacks',
    imageKey: 'bags',
    slug: 'bags',
  },
  {
    title: 'Jewellery & Accessories',
    subtitle: 'Earrings, bangles, hair pieces',
    imageKey: 'jewelry',
    slug: 'jewellery',
  },
  {
    title: 'Home Decor',
    subtitle: 'Nakshi cushions, throws, wall pieces',
    imageKey: 'homedecor',
    slug: 'home-decor',
  },
];

export const TrustAndFinishLook: React.FC<TrustAndFinishLookProps> = ({
  onSelectCategorySlug,
}) => {
  return (
    <>
      <div className="border-y border-[#e8d5d8] py-7 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <b className="block text-base font-semibold text-[#1a0508]">
              Free delivery
            </b>
            <span className="text-sm text-[#7a5c61]">In Dhaka over ৳2,500</span>
          </div>
          <div>
            <b className="block text-base font-semibold text-[#1a0508]">
              7-day returns
            </b>
            <span className="text-sm text-[#7a5c61]">
              Unworn items, easy exchange
            </span>
          </div>
          <div>
            <b className="block text-base font-semibold text-[#1a0508]">
              Cash on delivery
            </b>
            <span className="text-sm text-[#7a5c61]">
              Or bKash, Nagad nationwide
            </span>
          </div>
          <div>
            <b className="block text-base font-semibold text-[#1a0508]">
              Direct support
            </b>
            <span className="text-sm text-[#7a5c61]">Ask us anything, daily</span>
          </div>
        </div>
      </div>

      <section id="more" className="py-14">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="mb-6">
            <h2 className="font-display text-[32px] sm:text-[44px] leading-tight tracking-[-0.5px] text-[#1a0508]">
              Finish the look
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            {LIFESTYLE_TILES.map((tile) => (
              <button
                key={tile.title}
                type="button"
                onClick={() => {
                  onSelectCategorySlug(tile.slug);
                  document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative aspect-square rounded-sm overflow-hidden flex items-end p-6 text-left text-white group bg-[#4a0012]"
              >
                <ResilientImage
                  src={tile.imageKey}
                  alt={tile.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2b000a]/85 via-[#2b000a]/25 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-display text-3xl leading-tight">
                    {tile.title}
                  </h3>
                  <span className="block text-sm text-white/85 mt-1">
                    {tile.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
