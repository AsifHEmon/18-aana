import React from 'react';
import { ResilientImage } from './ResilientImage.tsx';

interface WinterSpecialProps {
  onSelectWinter: (categorySlug?: string) => void;
}

export const WinterSpecial: React.FC<WinterSpecialProps> = ({
  onSelectWinter,
}) => {
  const handleSelect = (slug?: string) => {
    onSelectWinter(slug);
    document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="winter" className="bg-[#fcf5f6] py-14">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 items-center">
        <div>
          <h2 className="font-display text-[40px] sm:text-[58px] leading-[1.04] tracking-[-1.2px] text-[#1a0508] [text-wrap:balance]">
            Winter special
          </h2>
          <p className="text-[#7a5c61] max-w-[40ch] mt-3.5 mb-6 text-base leading-relaxed">
            Handwoven wool shawls, brushed flannel shirts and crisp winter layers for the cooler weeks ahead.
          </p>
          <button
            type="button"
            onClick={() => handleSelect()}
            className="inline-block px-7 py-3 bg-[#1a0508] text-white border-[1.5px] border-[#1a0508] font-medium rounded-sm hover:bg-transparent hover:text-[#1a0508] transition-colors whitespace-nowrap"
          >
            Shop winter
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3.5">
          {[
            { label: 'Shawl', key: 'shawl', slug: 'shawl' },
            { label: 'Flannel Shirt', key: 'flannel', slug: 'flannel' },
            { label: 'Winter Kurti', key: 'kurti', slug: 'kurti' },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => handleSelect(card.slug)}
              className="relative aspect-[3/4] rounded-sm overflow-hidden flex items-end text-left group bg-[#e8d5d8]"
            >
              <ResilientImage
                src={card.key}
                alt={card.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="relative z-10 m-2.5 bg-white text-[#1a0508] px-3 py-1 text-xs sm:text-sm font-medium rounded-sm">
                {card.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
