import { CHENNAI_JUNCTIONS } from '../../data/chennaiJunctions';

/** 3D signal head layout for the Anna Nagar prototype digital twin (`JunctionScene`). */

export type JunctionApproach = 'north' | 'south' | 'east' | 'west';

export const JUNCTION_SIGNAL_HEADS: Record<
  JunctionApproach,
  { position: [number, number, number]; axis: 'NS' | 'EW'; signalHeadId: string }
> = {
  north: { position: [-6, 0, 6], axis: 'NS', signalHeadId: 'signal-ns-nw' },
  south: { position: [6, 0, -6], axis: 'NS', signalHeadId: 'signal-ns-se' },
  east: { position: [6, 6, 0], axis: 'EW', signalHeadId: 'signal-ew-ne' },
  west: { position: [-6, -6, 0], axis: 'EW', signalHeadId: 'signal-ew-sw' },
};

const MAP_CENTROID = (() => {
  const n = CHENNAI_JUNCTIONS.length || 1;
  const lat = CHENNAI_JUNCTIONS.reduce((s, j) => s + j.lat, 0) / n;
  const lng = CHENNAI_JUNCTIONS.reduce((s, j) => s + j.lng, 0) / n;
  return { lat, lng };
})();

/** Picks the nearest approach camera from existing junction map coordinates (no new geo data). */
export function approachForChennaiJunction(lat: number, lng: number): JunctionApproach {
  const dLat = lat - MAP_CENTROID.lat;
  const dLng = lng - MAP_CENTROID.lng;
  if (Math.abs(dLat) >= Math.abs(dLng)) {
    return dLat >= 0 ? 'south' : 'north';
  }
  return dLng >= 0 ? 'east' : 'west';
}
