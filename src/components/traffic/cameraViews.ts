import type { JunctionApproach } from './junctionLayout';
import { JUNCTION_SIGNAL_HEADS } from './junctionLayout';

export type SimulationCameraMode = 'cctv' | 'intersection' | 'top-down';

export interface CameraViewSpec {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

function signalLookAt(approach: JunctionApproach): [number, number, number] {
  const [x, , z] = JUNCTION_SIGNAL_HEADS[approach].position;
  return [x, 1.4, z];
}

const CCTV_OFFSET: Record<JunctionApproach, [number, number, number]> = {
  north: [0, 2.8, 14],
  south: [0, 2.8, -14],
  east: [14, 3.2, 0],
  west: [-14, 3.2, 0],
};

const INTERSECTION_OFFSET: Record<JunctionApproach, [number, number, number]> = {
  north: [-2, 9, 22],
  south: [2, 9, -22],
  east: [24, 10, 2],
  west: [-24, 10, -2],
};

export function getCameraViewSpec(
  approach: JunctionApproach,
  mode: SimulationCameraMode,
): CameraViewSpec {
  const lookAt = signalLookAt(approach);
  const [lx, ly, lz] = lookAt;

  if (mode === 'top-down') {
    return {
      position: [0, 38, 0.01],
      lookAt: [0, 0, 0],
      fov: 42,
    };
  }

  const offset = mode === 'cctv' ? CCTV_OFFSET[approach] : INTERSECTION_OFFSET[approach];
  return {
    position: [lx + offset[0], ly + offset[1], lz + offset[2]],
    lookAt,
    fov: mode === 'cctv' ? 52 : 48,
  };
}

export const SIMULATION_CAMERA_MODE_LABEL: Record<SimulationCameraMode, string> = {
  cctv: 'CCTV',
  intersection: 'INTERSECTION',
  'top-down': 'TOP DOWN',
};
