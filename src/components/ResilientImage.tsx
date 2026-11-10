import React, { useState } from 'react';
import { Shirt } from 'lucide-react';
import { resolveProductImage } from '../lib/images.ts';

interface ResilientImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const resolved = resolveProductImage(src);

  if (failed || !resolved) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#fcf5f6] to-[#f3dfe3] text-[#7a001e]/60 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Shirt className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#7a001e]/80 line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};
