/**
 * Utility functions for formatting player names and team badges
 */

export function splitPlayerFirstLastName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { firstName: '', lastName: parts[0] || '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function formatPlayerInitialLastName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed;
  const initial = parts[0][0].toUpperCase() + '.';
  const lastName = parts.slice(1).join(' ');
  return `${initial} ${lastName}`;
}

export function formatTeamPosSubtitle(teamCode: string, position?: string): string {
  const team = (teamCode || 'NFL').toUpperCase();
  const pos = (position || 'STAR').toUpperCase();
  return `${team} · ${pos}`;
}
