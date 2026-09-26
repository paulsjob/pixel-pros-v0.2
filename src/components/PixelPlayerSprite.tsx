import React from 'react';
import { AvatarConfig, SportId } from '../types';

interface PixelPlayerSpriteProps {
  avatar?: Partial<AvatarConfig>;
  number?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  isSilhouette?: boolean;
  withShadow?: boolean;
  className?: string;
  animate?: boolean;
  sport?: SportId;
  isOnFire?: boolean;
  injuryStatus?: 'I' | 'Q' | null;
}

export const PixelPlayerSprite: React.FC<PixelPlayerSpriteProps> = ({
  avatar = {
    helmetColor: '#155e9e',
    jerseyColor: '#155e9e',
    stripeColor: '#ffffff',
    skinTone: '#d98c55',
    number: 88,
  },
  number,
  size = 'md',
  isSilhouette = false,
  withShadow = true,
  className = '',
  animate = false,
  sport = 'nfl',
  isOnFire = false,
  injuryStatus,
}) => {
  const displayNum = number ?? avatar?.number ?? (sport === 'nba' ? 23 : 88);

  // Scaling dimensions
  const scaleMap: Record<string, { width: number; height: number }> = {
    xs: { width: 36, height: 50 },
    sm: { width: 52, height: 72 },
    md: { width: 84, height: 116 },
    lg: { width: 140, height: 190 },
    xl: { width: 190, height: 260 },
  };

  let width = 84;
  let height = 116;

  if (typeof size === 'number') {
    width = size;
    height = Math.round(size * 1.38);
  } else if (size && scaleMap[size]) {
    width = scaleMap[size].width;
    height = scaleMap[size].height;
  } else {
    width = scaleMap.md.width;
    height = scaleMap.md.height;
  }

  // NBA SILHOUETTE
  if (isSilhouette && sport === 'nba') {
    return (
      <div
        className={`relative flex items-center justify-center select-none ${className}`}
        style={{ width, height }}
      >
        <svg
          viewBox="0 0 36 50"
          width={width}
          height={height}
          style={{ shapeRendering: 'crispEdges' }}
          className="filter drop-shadow-sm opacity-65 hover:opacity-85 transition-opacity"
        >
          <g fill="#a69480">
            {/* Head / Hair */}
            <rect x="13" y="5" width="10" height="11" rx="1" />
            <rect x="12" y="8" width="12" height="8" />
            {/* Neck */}
            <rect x="15" y="16" width="6" height="3" fill="#8f7d6a" />
            {/* Sleeveless Torso (Tank Top) */}
            <rect x="11" y="19" width="14" height="14" fill="#998774" />
            {/* Bare Arms */}
            <rect x="7" y="20" width="4" height="12" />
            <rect x="25" y="20" width="4" height="12" />
            {/* Basketball Silhouette */}
            <circle cx="28" cy="27" r="4" fill="#756453" />
            {/* Shorts */}
            <rect x="10" y="32" width="7" height="8" fill="#8a7866" />
            <rect x="19" y="32" width="7" height="8" fill="#8a7866" />
            {/* Legs */}
            <rect x="12" y="40" width="4" height="5" />
            <rect x="20" y="40" width="4" height="5" />
            {/* Sneakers */}
            <rect x="10" y="45" width="6" height="3" fill="#756453" />
            <rect x="20" y="45" width="6" height="3" fill="#756453" />
          </g>
        </svg>
      </div>
    );
  }

  // NFL SILHOUETTE (Strictly unchanged)
  if (isSilhouette) {
    // Exact grey-brown silhouette as seen in Image 2 and 3
    return (
      <div
        className={`relative flex items-center justify-center select-none ${className}`}
        style={{ width, height }}
      >
        <svg
          viewBox="0 0 36 50"
          width={width}
          height={height}
          style={{ shapeRendering: 'crispEdges' }}
          className="filter drop-shadow-sm opacity-65 hover:opacity-85 transition-opacity"
        >
          {/* Silhouette body & helmet */}
          <g fill="#a69480">
            {/* Helmet */}
            <rect x="11" y="5" width="14" height="15" rx="1" />
            <rect x="9" y="8" width="18" height="11" />
            {/* Facemask hint */}
            <rect x="18" y="14" width="7" height="6" fill="#8f7d6a" />
            {/* Neck & Shoulders */}
            <rect x="12" y="20" width="12" height="4" fill="#998774" />
            <rect x="8" y="22" width="20" height="10" />
            {/* Arms */}
            <rect x="6" y="24" width="4" height="11" />
            <rect x="26" y="24" width="4" height="11" />
            {/* Torso */}
            <rect x="10" y="25" width="16" height="11" fill="#968471" />
            {/* Legs */}
            <rect x="11" y="36" width="6" height="10" fill="#8a7866" />
            <rect x="19" y="36" width="6" height="10" fill="#8a7866" />
            {/* Cleats */}
            <rect x="9" y="44" width="8" height="4" fill="#756453" />
            <rect x="19" y="44" width="8" height="4" fill="#756453" />
          </g>
        </svg>
      </div>
    );
  }

  const helmet = avatar.helmetColor || '#155e9e';
  const jersey = avatar.jerseyColor || '#155e9e';
  const stripe = avatar.stripeColor || '#ffffff';
  // Universal neutral middle skin tone so all players are consistent and never flicker
  const skin = '#d49b6a';

  const isJerseyLight =
    jersey.toLowerCase() === '#ffffff' ||
    jersey.toLowerCase() === '#f8fafc' ||
    jersey.toLowerCase() === '#f1f5f9' ||
    jersey.toLowerCase() === '#fae5b8';

  // Watch white on white: if jersey is white/light, pants MUST NEVER be white!
  let pants = avatar.pantsColor || jersey;
  if (isJerseyLight && (!avatar.pantsColor || avatar.pantsColor.toLowerCase() === '#ffffff')) {
    pants = helmet.toLowerCase() !== '#ffffff' ? helmet : (stripe.toLowerCase() !== '#ffffff' ? stripe : '#1a2238');
  }

  // Number color: if jersey is white/light, number MUST be high-contrast dark or team color, never white!
  const numberColor =
    avatar.numberColor ||
    (isJerseyLight ? (helmet.toLowerCase() !== '#ffffff' ? helmet : '#111827') : '#ffffff');

  // -------------------------------------------------------------
  // Injury Visual Cue Filter:
  // - Both 'I' (Injured / Out) and 'Q' (Questionable): 100% grayscale (no color at all)
  // -------------------------------------------------------------
  const injuryFilterStyle: React.CSSProperties =
    injuryStatus === 'I' || injuryStatus === 'Q'
      ? { filter: 'grayscale(100%)' }
      : {};

  // -------------------------------------------------------------
  // NBA BASKETBALL SPRITE (Tank top, bare shoulders, basketball)
  // -------------------------------------------------------------
  if (sport === 'nba') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center select-none ${className} ${
          animate ? 'animate-bounce-subtle' : ''
        }`}
        style={{ width, height, ...injuryFilterStyle }}
      >
        {/* "He's on Fire!" Animated Pixel Flame Halo */}
        {isOnFire && (
          <div className="absolute -top-3 inset-x-0 flex justify-center pointer-events-none animate-pulse">
            <span className="text-xs font-mono font-black text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]">
              🔥 ON FIRE!
            </span>
          </div>
        )}

        <svg
          viewBox="0 0 38 52"
          width={width}
          height={height}
          style={{ shapeRendering: 'crispEdges' }}
          className="overflow-visible"
        >
          {/* Flame Backing Pixels when On Fire */}
          {isOnFire && (
            <g opacity="0.85">
              <rect x="6" y="14" width="3" height="6" fill="#ef4444" className="animate-ping" />
              <rect x="29" y="16" width="3" height="5" fill="#f59e0b" className="animate-ping" />
              <rect x="10" y="4" width="4" height="4" fill="#fbbf24" />
              <rect x="24" y="3" width="4" height="5" fill="#ef4444" />
              <rect x="17" y="1" width="4" height="4" fill="#f59e0b" />
            </g>
          )}

          {/* Hardwood Floor Shadow */}
          {withShadow && (
            <ellipse
              cx="19"
              cy="48.5"
              rx="13"
              ry="3"
              fill="#3a200a"
              opacity="0.55"
            />
          )}

          {/* 1. HEAD & HAIR / HEADBAND */}
          {/* Hair base */}
          <rect x="12" y="4" width="14" height="12" fill="#1c110a" />
          <rect x="10" y="6" width="18" height="8" fill="#1c110a" />
          {/* Headband with team stripe color */}
          <rect x="11" y="8" width="16" height="3" fill={stripe} />
          {/* Face Skin */}
          <rect x="12" y="11" width="14" height="8" fill={skin} />
          {/* Pixel Eyes */}
          <rect x="14" y="13" width="2" height="2" fill="#180e07" />
          <rect x="22" y="13" width="2" height="2" fill="#180e07" />
          {/* Mouth / Jawline */}
          <rect x="16" y="17" width="6" height="1.5" fill="#3a200a" opacity="0.4" />

          {/* 2. TANK TOP / SLEEVELESS JERSEY */}
          {/* Bare Pixel Shoulders / Arms */}
          <rect x="7" y="20" width="4" height="13" fill={skin} />
          <rect x="27" y="20" width="4" height="12" fill={skin} />

          {/* Tank Top Body */}
          <rect x="11" y="19" width="16" height="15" fill={jersey} />
          {/* Tank top armhole cutouts (revealing skin) */}
          <rect x="11" y="19" width="2" height="6" fill={skin} />
          <rect x="25" y="19" width="2" height="6" fill={skin} />
          {/* Tank top collar trim */}
          <rect x="14" y="19" width="10" height="2" fill={stripe} />
          {/* Side stripes on tank top */}
          <rect x="11" y="25" width="1.5" height="9" fill={stripe} />
          <rect x="25.5" y="25" width="1.5" height="9" fill={stripe} />

          {/* Basketball held in left hand */}
          <circle cx="29" cy="32" r="4.5" fill="#ea580c" />
          {/* Basketball black rib lines */}
          <rect x="26" y="31.5" width="6" height="1" fill="#1c1917" />
          <line x1="29" y1="28" x2="29" y2="36" stroke="#1c1917" strokeWidth="1" />

          {/* Jersey Number */}
          <text
            x="19"
            y="29"
            textAnchor="middle"
            fill={numberColor}
            fontFamily="'Press Start 2P', monospace"
            fontSize="7"
            fontWeight="bold"
            stroke="#000000"
            strokeWidth="0.5"
          >
            {displayNum}
          </text>

          {/* 3. BASKETBALL SHORTS */}
          <rect x="10" y="34" width="8" height="8" fill={pants} />
          <rect x="20" y="34" width="8" height="8" fill={pants} />
          {/* Shorts Trim */}
          <rect x="9.5" y="40.5" width="8.5" height="1.5" fill={stripe} />
          <rect x="20" y="40.5" width="8.5" height="1.5" fill={stripe} />

          {/* 4. LEGS & KNEE PADS */}
          <rect x="12" y="42" width="4.5" height="3" fill={skin} />
          <rect x="21.5" y="42" width="4.5" height="3" fill={skin} />

          {/* 5. CREW SOCKS & SNEAKERS */}
          {/* White crew socks */}
          <rect x="11.5" y="44" width="5" height="2.5" fill="#ffffff" />
          <rect x="21" y="44" width="5" height="2.5" fill="#ffffff" />
          {/* High-top Basketball Sneakers */}
          <rect x="10" y="46.5" width="7.5" height="2.5" fill={jersey} />
          <rect x="20.5" y="46.5" width="7.5" height="2.5" fill={jersey} />
          {/* Sneaker Rubber Sole */}
          <rect x="9.5" y="48.5" width="8" height="1" fill="#ffffff" />
          <rect x="20" y="48.5" width="8" height="1" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // NFL FOOTBALL SPRITE (100% UNTOUCHED, EXACT ORIGINAL DESIGN)
  // -------------------------------------------------------------
  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className} ${
        animate ? 'animate-bounce-subtle' : ''
      }`}
      style={{ width, height, ...injuryFilterStyle }}
    >
      <svg
        viewBox="0 0 38 52"
        width={width}
        height={height}
        style={{ shapeRendering: 'crispEdges' }}
        className="overflow-visible"
      >
        {/* Subtle Turf Ground Shadow as seen in Image 1 & 2 */}
        {withShadow && (
          <ellipse
            cx="19"
            cy="48.5"
            rx="14"
            ry="3.2"
            fill="#8ce6f4"
            opacity="0.85"
          />
        )}

        {/* 1. HELMET */}
        {/* Helmet Base */}
        <rect x="10" y="4" width="16" height="15" fill={helmet} />
        <rect x="8" y="7" width="20" height="11" fill={helmet} />
        {/* Helmet top highlight / bevel */}
        <rect x="11" y="3" width="14" height="2" fill={stripe} opacity="0.3" />
        {/* White Center Stripe */}
        <rect x="16" y="3" width="4" height="15" fill={stripe} />
        {/* Helmet ear dark hole */}
        <rect x="9" y="13" width="2" height="3" fill="#082b4a" />
        {/* Helmet back shadow */}
        <rect x="8" y="15" width="4" height="3" fill="#0a3254" />

        {/* 2. FACE & FACEMASK */}
        {/* Face skin */}
        <rect x="13" y="11" width="12" height="7" fill={skin} />
        {/* Pixel Eyes */}
        <rect x="15" y="13" width="2" height="2" fill="#2c1a0c" />
        <rect x="21" y="13" width="2" height="2" fill="#2c1a0c" />
        {/* Facemask / Grill Bars */}
        <rect x="12" y="16" width="14" height="2" fill="#e8edf2" />
        <rect x="13" y="18" width="12" height="1.5" fill="#c4d0dc" />
        {/* Vertical grill bars */}
        <rect x="14" y="16" width="1.5" height="3.5" fill="#8b9dae" />
        <rect x="18" y="16" width="1.5" height="3.5" fill="#8b9dae" />
        <rect x="22" y="16" width="1.5" height="3.5" fill="#8b9dae" />

        {/* 3. UPPER BODY / JERSEY */}
        {/* Neck collar */}
        <rect x="14" y="20" width="8" height="2" fill={jersey} />
        {/* Shoulder Pads & Jersey */}
        <rect x="7" y="22" width="22" height="14" fill={jersey} />
        {/* White sleeve stripes */}
        <rect x="6" y="24" width="3" height="2" fill={stripe} />
        <rect x="27" y="24" width="3" height="2" fill={stripe} />
        <rect x="6" y="27" width="3" height="1.5" fill={stripe} />
        <rect x="27" y="27" width="3" height="1.5" fill={stripe} />

        {/* Arms / Skin */}
        <rect x="7" y="29" width="3" height="7" fill={skin} />
        <rect x="26" y="29" width="3" height="6" fill={skin} />

        {/* Football tucked in left arm (matches mockup image 1 & 2) */}
        <ellipse cx="27" cy="32" rx="3.5" ry="2.2" fill="#78350f" transform="rotate(35 27 32)" />
        <rect x="26" y="31" width="2" height="1" fill="#ffffff" opacity="0.9" />

        {/* Jersey Number: 88, 85, etc. */}
        <g fill={numberColor}>
          {displayNum === 88 ? (
            // Double 8 pixel art
            <>
              {/* Left 8 */}
              <rect x="12" y="25" width="5" height="8" fill={numberColor} />
              <rect x="13" y="26" width="3" height="2" fill={jersey} />
              <rect x="13" y="29" width="3" height="3" fill={jersey} />
              {/* Right 8 */}
              <rect x="19" y="25" width="5" height="8" fill={numberColor} />
              <rect x="20" y="26" width="3" height="2" fill={jersey} />
              <rect x="20" y="29" width="3" height="3" fill={jersey} />
            </>
          ) : (
            // Generic dynamic pixel number render
            <text
              x="18"
              y="32"
              textAnchor="middle"
              fill={numberColor}
              fontFamily="'Press Start 2P', monospace"
              fontSize="7"
              fontWeight="bold"
            >
              {displayNum}
            </text>
          )}
        </g>

        {/* 4. LEGS & PANTS */}
        <rect x="11" y="36" width="6" height="9" fill={pants} />
        <rect x="19" y="36" width="6" height="9" fill={pants} />
        {/* Pants side stripe */}
        <rect x="11" y="37" width="1.5" height="7" fill={stripe} />
        <rect x="23.5" y="37" width="1.5" height="7" fill={stripe} />

        {/* 5. CLEATS & SOCKS */}
        {/* Ankle tape / white socks */}
        <rect x="10" y="44" width="7" height="2" fill="#ffffff" />
        <rect x="19" y="44" width="7" height="2" fill="#ffffff" />
        {/* Blue shoes */}
        <rect x="9" y="46" width="8.5" height="2.5" fill="#082b4a" />
        <rect x="18.5" y="46" width="8.5" height="2.5" fill="#082b4a" />
        {/* White bottom cleat sole */}
        <rect x="8.5" y="48" width="9" height="1" fill="#ffffff" />
        <rect x="18" y="48" width="9" height="1" fill="#ffffff" />
      </svg>
    </div>
  );
};
