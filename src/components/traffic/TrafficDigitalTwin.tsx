import { Canvas } from '@react-three/fiber';

import { Suspense } from 'react';

import type { SignalPhase, VehicleState } from '../../types/flowiq';

import { SimCameraRig, type SimulationCameraMode } from './CameraControls';

import { JunctionScene } from './JunctionScene';

import type { JunctionApproach } from './junctionLayout';



export function TrafficDigitalTwin({

  vehicles,

  signalPhase,

  cameraApproach,

  cameraMode,

  highlightedApproach,

}: {

  vehicles: VehicleState[];

  signalPhase: SignalPhase;

  cameraApproach: JunctionApproach;

  cameraMode: SimulationCameraMode;

  highlightedApproach?: JunctionApproach;

}) {

  const initialFov = 45;

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-[#334155] bg-[#0f172a]"
      style={{ height: 'min(58vh, 520px)', minHeight: 420 }}
    >
      <Canvas
        className="!block w-full h-full"
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [22, 18, 22], fov: initialFov, near: 0.1, far: 500 }}
      >
        <color attach="background" args={['#1a2332']} />
        <Suspense fallback={null}>
          <SimCameraRig approach={cameraApproach} mode={cameraMode} />
          <JunctionScene
            vehicles={vehicles}
            signalPhase={signalPhase}
            highlightedApproach={highlightedApproach}
          />
        </Suspense>
      </Canvas>
    </div>
  );

}

