import React from 'react';

interface BrandMarkProps {
  size?: number;
  light?: boolean;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 42,
  light = false,
  className = '',
}) => {
  const spokes = Array.from({ length: 18 }, (_, i) => {
    const angle = ((i * 20 - 90) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const isExtraTwo = i >= 16;
    const x1 = (210 + 148 * cos).toFixed(1);
    const y1 = (210 + 148 * sin).toFixed(1);
    const x2 = (210 + 200 * cos).toFixed(1);
    const y2 = (210 + 200 * sin).toFixed(1);
    const stroke = isExtraTwo
      ? '#d4af37'
      : light
        ? '#ffffff'
        : '#1a0508';
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={isExtraTwo ? 24 : 18}
        strokeLinecap="round"
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 420 420"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {spokes}
      <circle cx="210" cy="210" r="126" fill="#7a001e" />
      <text
        x="210"
        y="240"
        textAnchor="middle"
        fontFamily="DM Serif Display, Georgia, serif"
        fontSize="112"
        fill="#ffffff"
      >
        18
      </text>
      <text
        x="210"
        y="294"
        textAnchor="middle"
        fontFamily="DM Serif Display, Georgia, serif"
        fontStyle="italic"
        fontSize="44"
        fill="#ffccd5"
      >
        aana
      </text>
    </svg>
  );
};
