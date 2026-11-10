import React from 'react';
import { ResilientImage } from './ResilientImage.tsx';

export const Hero: React.FC = () => {
  return (
    <section className="bg-[#7a001e] text-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[520px]">
        <div>
          <h1 className="font-display text-[44px] sm:text-[60px] lg:text-[78px] leading-[1.05] tracking-[-1.5px] [text-wrap:balance]">
            Sixteen aana is whole.{' '}
            <em className="italic text-[#ffccd5]">We add two.</em>
          </h1>
          <p className="max-w-[44ch] text-white/85 mt-5 mb-7 text-lg leading-relaxed">
            Festive and everyday clothing for men, women and kids. Handloom weaves and new winter pieces are in.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#depts"
              className="inline-block px-7 py-3.5 bg-white text-[#7a001e] border-[1.5px] border-white font-semibold rounded-sm hover:bg-transparent hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Shop the collection
            </a>
            <a
              href="#winter"
              className="inline-block px-7 py-3.5 bg-transparent text-white border-[1.5px] border-white font-semibold rounded-sm hover:bg-white hover:text-[#7a001e] transition-colors whitespace-nowrap shrink-0"
            >
              Winter special
            </a>
          </div>
        </div>

        {/* 3-card tilted editorial photo stack */}
        <div className="relative h-[340px] sm:h-[440px] lg:h-[470px]" aria-hidden="true">
          <div className="absolute left-0 top-8 w-[45%] aspect-[3/4] rounded-sm overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.35)] -rotate-4 bg-[#4a0012]">
            <ResilientImage
              src="sharee"
              alt="Jamdani Sharee"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2.5 left-2.5 bg-white text-[#1a0508] px-2.5 py-1 text-xs sm:text-sm font-medium rounded-sm">
              Jamdani Sharee
            </span>
          </div>

          <div className="absolute left-[27%] top-0 z-10 w-[47%] aspect-[3/4] rounded-sm overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)] bg-[#4a0012]">
            <ResilientImage
              src="punjabi"
              alt="Cotton Punjabi"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2.5 left-2.5 bg-white text-[#1a0508] px-2.5 py-1 text-xs sm:text-sm font-medium rounded-sm">
              Cotton Punjabi
            </span>
          </div>

          <div className="absolute right-0 top-16 w-[45%] aspect-[3/4] rounded-sm overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.35)] rotate-4 bg-[#4a0012]">
            <ResilientImage
              src="fatua"
              alt="Kids Fatua"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2.5 left-2.5 bg-white text-[#1a0508] px-2.5 py-1 text-xs sm:text-sm font-medium rounded-sm">
              Kids Fatua
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
