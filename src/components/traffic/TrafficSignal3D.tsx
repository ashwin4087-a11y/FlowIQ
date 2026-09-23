import type { SignalPhase } from '../../types/flowiq';

function Lamp({ color, on }: { color: string; on: boolean }) {
  return (
    <mesh>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={on ? color : '#111'}
        emissiveIntensity={on ? 1.2 : 0}
      />
    </mesh>
  );
}

export function TrafficSignal3D({
  position,
  phase,
  axis,
}: {
  position: [number, number, number];
  phase: SignalPhase;
  axis: 'NS' | 'EW';
}) {
  const nsGreen = phase === 'NORTH_SOUTH_GREEN';
  const nsYellow = phase === 'NORTH_SOUTH_YELLOW';
  const ewGreen = phase === 'EAST_WEST_GREEN';
  const ewYellow = phase === 'EAST_WEST_YELLOW';
  const allRed = phase === 'ALL_RED';

  const redOn = axis === 'NS' ? !nsGreen && !nsYellow : !ewGreen && !ewYellow;
  const yellowOn = axis === 'NS' ? nsYellow : ewYellow;
  const greenOn = axis === 'NS' ? nsGreen : ewGreen;

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.25, 2.4, 0.25]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <group position={[0, 1.8, 0.2]}>
        <Lamp color="#ef4444" on={allRed || redOn} />
        <group position={[0, -0.35, 0]}>
          <Lamp color="#eab308" on={yellowOn} />
        </group>
        <group position={[0, -0.7, 0]}>
          <Lamp color="#22c55e" on={greenOn} />
        </group>
      </group>
    </group>
  );
}
