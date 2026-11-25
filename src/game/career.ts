import { validLayout } from './layout';
import type { Placement } from './layout';
import type { Pack } from './shift';

export type Career = { version: 1; day: number; cash: number; reputation: number; extraPlates: boolean; placements: Placement[] };
const key = 'burger-town.career';
const backup = key + '.backup';

export const newCareer = (pack: Pack): Career => ({
  version: 1, day: 1, cash: pack.restaurant.startCash, reputation: 0, extraPlates: false, placements: [],
});

function parse(raw: string | null, pack: Pack): Career | undefined {
  if (!raw) return;
  try {
    const value = JSON.parse(raw) as Partial<Career> | null;
    if (value?.version === 1 && Number.isSafeInteger(value.day) && value.day! >= 1 &&
      value.day! <= pack.restaurant.days.length && Number.isSafeInteger(value.cash) &&
      Number.isSafeInteger(value.reputation) && value.reputation! >= 0 &&
      typeof value.extraPlates === 'boolean') {
      const placements = value.placements ?? [];
      if (Array.isArray(placements) && validLayout(placements)) return { ...value, placements } as Career;
    }
  } catch { return; }
}

export function loadCareer(pack: Pack) {
  try {
    const raw = localStorage.getItem(key);
    const current = parse(raw, pack);
    if (current) return { career: current, recovered: false };
    const prior = parse(localStorage.getItem(backup), pack);
    return { career: prior ?? newCareer(pack), recovered: raw !== null || prior !== undefined };
  } catch {
    return { career: newCareer(pack), recovered: true };
  }
}

export function saveCareer(career: Career, pack: Pack) {
  try {
    const previous = localStorage.getItem(key);
    if (previous && parse(previous, pack)) localStorage.setItem(backup, previous);
    localStorage.setItem(key, JSON.stringify(career));
    return true;
  } catch { return false; }
}
