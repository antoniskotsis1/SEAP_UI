/** Parsed geographic coordinate. */
export interface LatLon {
  lat: number;
  lon: number;
}

const inRange = (lat: number, lon: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lon) <= 180;

/**
 * Parse a free-text GPS string into `{ lat, lon }`, or `null` when it can't be
 * understood. Accepts:
 *   • decimal — "37.98,23.72", "37.98 23.72", "37.98; 23.72" (optional signs)
 *   • DMS     — `39°07'25.4"N 20°55'11.1"E` (quotes/spacing lenient)
 */
export function parseCoords(raw?: string | null): LatLon | null {
  if (!raw) return null;
  const s = raw.trim();

  // Decimal "lat<sep>lon".
  const dec = s.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (dec) {
    const lat = Number(dec[1]);
    const lon = Number(dec[2]);
    return inRange(lat, lon) ? { lat, lon } : null;
  }

  // DMS "D°M'S"H  D°M'S"H".
  const dms = s.match(
    /(\d+)[°:\s]+(\d+)['′:\s]+([\d.]+)"?\s*([NSns])[,\s]+(\d+)[°:\s]+(\d+)['′:\s]+([\d.]+)"?\s*([EWew])/,
  );
  if (dms) {
    const lat =
      (Number(dms[1]) + Number(dms[2]) / 60 + Number(dms[3]) / 3600) *
      (/[Ss]/.test(dms[4] ?? "") ? -1 : 1);
    const lon =
      (Number(dms[5]) + Number(dms[6]) / 60 + Number(dms[7]) / 3600) *
      (/[Ww]/.test(dms[8] ?? "") ? -1 : 1);
    return inRange(lat, lon) ? { lat, lon } : null;
  }

  return null;
}

/** OpenStreetMap embeddable map URL centered on the coordinate with a marker. */
export function osmEmbedUrl(lat: number, lon: number): string {
  const d = 0.008;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`;
}
