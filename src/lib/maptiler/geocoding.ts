import type { GeocodingFeature } from '@maptiler/client';
import { applyMapTilerApiKey } from './config';

/** Default map viewport (Chennai prototype); used only as MapTiler `proximity` bias — not a geo lock. */
export const ROUTE_PLANNER_MAP_PROXIMITY: [number, number] = [80.27, 13.08];

export interface PlaceSuggestion {
  id: string;
  primary: string;
  secondary: string;
  lng: number;
  lat: number;
  placeName: string;
}

export function geocodingFeatureToSuggestion(f: GeocodingFeature): PlaceSuggestion {
  const primary = f.text?.trim() || f.place_name?.split(',')[0]?.trim() || 'Unknown';
  const fromContext = f.context?.map((c) => c.text).filter(Boolean).join(', ');
  let secondary = fromContext?.trim() ?? '';
  if (!secondary && f.place_name) {
    const parts = f.place_name.split(',').map((p) => p.trim());
    if (parts.length > 1) secondary = parts.slice(1).join(', ');
  }
  return {
    id: f.id,
    primary,
    secondary,
    lng: f.center[0],
    lat: f.center[1],
    placeName: f.place_name ?? primary,
  };
}

export async function forwardGeocodeSuggestions(
  query: string,
  options?: { proximity?: [number, number]; limit?: number },
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  if (!(await applyMapTilerApiKey())) {
    throw new Error('MapTiler API key not configured');
  }
  const { geocoding } = await import('@maptiler/sdk');
  const res = await geocoding.forward(q, {
    limit: options?.limit ?? 5,
    proximity: options?.proximity ?? ROUTE_PLANNER_MAP_PROXIMITY,
    language: ['en'],
  });
  return (res.features ?? []).map(geocodingFeatureToSuggestion);
}
