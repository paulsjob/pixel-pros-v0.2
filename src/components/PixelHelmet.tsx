import React from 'react';

interface PixelHelmetProps {
  teamCode?: string;
  teamName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  className?: string;
  alt?: string;
}

const SIZE_MAP = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
};

export const normalizeTeamCode = (code?: string): string => {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  const map: Record<string, string> = {
    ARIZONA: 'ARI',
    ATLANTA: 'ATL',
    BALTIMORE: 'BAL',
    BUFFALO: 'BUF',
    CAROLINA: 'CAR',
    CHICAGO: 'CHI',
    CINCINNATI: 'CIN',
    CLEVELAND: 'CLE',
    DALLAS: 'DAL',
    DENVER: 'DEN',
    DETROIT: 'DET',
    GREEN_BAY: 'GB',
    GREENBAY: 'GB',
    HOUSTON: 'HOU',
    INDIANAPOLIS: 'IND',
    JACKSONVILLE: 'JAX',
    JAC: 'JAX',
    KANSAS_CITY: 'KC',
    KANSASCITY: 'KC',
    LAS_VEGAS: 'LV',
    LASVEGAS: 'LV',
    LAS: 'LV',
    OAK: 'LV',
    OAKLAND: 'LV',
    LOS_ANGELES_CHARGERS: 'LAC',
    CHARGERS: 'LAC',
    LOS_ANGELES_RAMS: 'LAR',
    RAMS: 'LAR',
    LA: 'LAR',
    LAR: 'LAR',
    LAC: 'LAC',
    MIAMI: 'MIA',
    MINNESOTA: 'MIN',
    NEW_ENGLAND: 'NE',
    NEWENGLAND: 'NE',
    PATRIOTS: 'NE',
    NEW_ORLEANS: 'NO',
    NEWORLEANS: 'NO',
    SAINTS: 'NO',
    NEW_YORK_GIANTS: 'NYG',
    GIANTS: 'NYG',
    NEW_YORK_JETS: 'NYJ',
    JETS: 'NYJ',
    PHILADELPHIA: 'PHI',
    EAGLES: 'PHI',
    PITTSBURGH: 'PIT',
    STEELERS: 'PIT',
    SAN_FRANCISCO: 'SF',
    SANFRANCISCO: 'SF',
    SEATTLE: 'SEA',
    SEAHAWKS: 'SEA',
    TAMPA_BAY: 'TB',
    TAMPABAY: 'TB',
    BUCCANEERS: 'TB',
    TENNESSEE: 'TEN',
    TITANS: 'TEN',
    WASHINGTON: 'WSH',
    COMMANDERS: 'WSH',
    WSH: 'WSH',
    WAS: 'WSH',
  };
  return map[clean] || clean;
};

export const PixelHelmet: React.FC<PixelHelmetProps> = ({
  teamCode = '',
  teamName = '',
  size = 'md',
  className = '',
  alt,
}) => {
  const normalized = normalizeTeamCode(teamCode || teamName);
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 32;

  if (!normalized) return null;

  return (
    <img
      src={`/helmets/${normalized}.png`}
      alt={alt || `${normalized} Helmet`}
      width={pixelSize}
      height={pixelSize}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        objectFit: 'contain',
        imageRendering: 'pixelated',
      }}
      className={`select-none shrink-0 inline-block drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${className}`}
      loading="eager"
    />
  );
};
