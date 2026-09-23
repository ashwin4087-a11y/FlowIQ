import type { SignalPhase, VehicleState } from '../../types/flowiq';
import { JUNCTION_SIGNAL_HEADS, type JunctionApproach } from './junctionLayout';
import { TrafficSignal3D } from './TrafficSignal3D';
import { VehicleMesh } from './VehicleMesh';
function Road() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[10, 60]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[60, 10]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* stop lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 7]}>
        <planeGeometry args={[8, 0.3]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -7]}>
        <planeGeometry args={[8, 0.3]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0.02, 0]}>
        <planeGeometry args={[0.3, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0.02, 0]}>
        <planeGeometry args={[0.3, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

function VehiclesLayer({ vehicles }: { vehicles: VehicleState[] }) {
  return (
    <group>
      {vehicles.map((v) => (
        <group
          key={v.id}
          position={[v.position.x, v.position.y, v.position.z]}
          rotation={[0, v.heading ?? 0, 0]}
        >
          <VehicleMesh type={v.type} />
        </group>
      ))}
    </group>
  );
}

function SelectedSignalMarker({ approach }: { approach?: JunctionApproach }) {
  if (!approach) return null;
  const head = JUNCTION_SIGNAL_HEADS[approach];
  const [x, , z] = head.position;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, z]}>
      <ringGeometry args={[1.1, 1.35, 32]} />
      <meshBasicMaterial color="#0ea5e9" transparent opacity={0.45} />
    </mesh>
  );
}

export function JunctionScene({
  vehicles,
  signalPhase,
  highlightedApproach,
}: {
  vehicles: VehicleState[];
  signalPhase: SignalPhase;
  highlightedApproach?: JunctionApproach;
}) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight castShadow position={[15, 25, 10]} intensity={1.1} shadow-mapSize={[1024, 1024]} />
      <Road />
      {(Object.entries(JUNCTION_SIGNAL_HEADS) as [JunctionApproach, (typeof JUNCTION_SIGNAL_HEADS)[JunctionApproach]][]).map(
        ([, head]) => (
          <TrafficSignal3D
            key={head.signalHeadId}
            position={head.position}
            phase={signalPhase}
            axis={head.axis}
          />
        ),
      )}
      <SelectedSignalMarker approach={highlightedApproach} />
      <mesh position={[12, 2, 12]}>
        <boxGeometry args={[4, 8, 4]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-14, 1.5, -10]}>
        <boxGeometry args={[6, 5, 3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <VehiclesLayer vehicles={vehicles} />
    </>
  );
}
