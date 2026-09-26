import React from 'react';

export const PixelEmeraldGem: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    viewBox="0 0 16 18"
    width={size}
    height={size * 1.12}
    style={{ shapeRendering: 'crispEdges' }}
    className={`inline-block drop-shadow-sm ${className}`}
  >
    {/* Emerald Green Gem Pixel Art */}
    <rect x="5" y="1" width="6" height="2" fill="#10b981" />
    <rect x="3" y="3" width="10" height="2" fill="#059669" />
    <rect x="2" y="5" width="12" height="6" fill="#10b981" />
    {/* Top left highlight */}
    <rect x="4" y="4" width="4" height="2" fill="#6ee7b7" />
    <rect x="3" y="6" width="3" height="4" fill="#a7f3d0" />
    {/* Dark right bevel */}
    <rect x="11" y="5" width="3" height="6" fill="#047857" />
    {/* Bottom taper */}
    <rect x="3" y="11" width="10" height="2" fill="#059669" />
    <rect x="5" y="13" width="6" height="2" fill="#047857" />
    <rect x="7" y="15" width="2" height="2" fill="#064e3b" />
  </svg>
);

export const PixelDiamondCrystal: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    viewBox="0 0 18 18"
    width={size}
    height={size}
    style={{ shapeRendering: 'crispEdges' }}
    className={`inline-block drop-shadow-sm ${className}`}
  >
    {/* Diamond Star / Crystal Pixel Art */}
    <rect x="8" y="1" width="2" height="2" fill="#38bdf8" />
    <rect x="6" y="3" width="6" height="2" fill="#38bdf8" />
    <rect x="4" y="5" width="10" height="2" fill="#0284c7" />
    <rect x="2" y="7" width="14" height="4" fill="#0369a1" />
    <rect x="1" y="8" width="16" height="2" fill="#38bdf8" />
    {/* Center highlight */}
    <rect x="6" y="7" width="4" height="4" fill="#bae6fd" />
    <rect x="7" y="6" width="2" height="2" fill="#ffffff" />
    {/* Bottom taper */}
    <rect x="4" y="11" width="10" height="2" fill="#0284c7" />
    <rect x="6" y="13" width="6" height="2" fill="#0369a1" />
    <rect x="8" y="15" width="2" height="2" fill="#082f49" />
  </svg>
);

import { PixelHelmet } from './PixelHelmet';

export const PixelHelmetIcon: React.FC<{ size?: number; color?: string; className?: string; teamCode?: string }> = ({ size = 26, className = '', teamCode = 'KC' }) => (
  <PixelHelmet teamCode={teamCode} size={size} className={className} />
);

export const PixelShieldIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({ size = 32, color = '#12579b', className = '' }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size * 1.1 }}>
    <svg
      viewBox="0 0 24 28"
      width={size}
      height={size * 1.1}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Golden shield border */}
      <polygon points="12,1 23,4 23,17 12,27 1,17 1,4" fill="#f59e0b" />
      <polygon points="12,3 21,5.5 21,16 12,24.5 3,16 3,5.5" fill={color} />
      {/* Helmet inside */}
      <rect x="8" y="8" width="8" height="6" fill="#38bdf8" />
      <rect x="13" y="12" width="5" height="3" fill="#ffffff" />
      <rect x="7" y="12" width="2" height="2" fill="#0369a1" />
    </svg>
  </div>
);
