import type { Office } from './offices';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NearestOffice {
  office: Office;
  distanceKm: number;
}

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Great-circle distance in km (Haversine formula).
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Ties resolve to the first office in list order, so the result is deterministic.
export function findNearestOffice(from: Coordinates, offices: readonly Office[]): NearestOffice {
  let best: NearestOffice | null = null;
  for (const office of offices) {
    const distanceKm = haversineKm(from, office);
    if (best === null || distanceKm < best.distanceKm) best = { office, distanceKm };
  }
  if (best === null) throw new Error('No offices configured');
  return { office: best.office, distanceKm: Math.round(best.distanceKm * 10) / 10 };
}
