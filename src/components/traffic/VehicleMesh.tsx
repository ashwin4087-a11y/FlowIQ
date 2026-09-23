import { useMemo } from 'react';
import type { VehicleType } from '../../types/flowiq';

const COLORS: Record<VehicleType, string> = {
  CAR: '#0ea5e9',
  MOTORCYCLE: '#f59e0b',
  BUS: '#22c55e',
  TRUCK: '#6366f1',
  AMBULANCE: '#ef4444',
  FIRE_TRUCK: '#dc2626',
};

export function VehicleMesh({ type }: { type: VehicleType }) {
  const color = COLORS[type] ?? '#94a3b8';
  const scale = useMemo(() => {
    switch (type) {
      case 'BUS':
        return [1.4, 1.1, 3.2];
      case 'TRUCK':
        return [1.3, 1.2, 3.4];
      case 'MOTORCYCLE':
        return [0.5, 0.6, 1.2];
      case 'AMBULANCE':
      case 'FIRE_TRUCK':
        return [1.1, 1.1, 2.8];
      default:
        return [1, 0.8, 2];
    }
  }, [type]);

  return (
    <group>
      <mesh castShadow position={[0, scale[1] / 2, 0]}>
        <boxGeometry args={scale} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      </mesh>
      {(type === 'AMBULANCE' || type === 'FIRE_TRUCK') && (
        <mesh position={[0, scale[1] + 0.15, 0]}>
          <boxGeometry args={[0.8, 0.15, 0.8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}
