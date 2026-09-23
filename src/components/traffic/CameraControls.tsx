import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { getCameraViewSpec, type SimulationCameraMode } from './cameraViews';
import type { JunctionApproach } from './junctionLayout';

export type { SimulationCameraMode };

function applyCameraSpec(
  camera: PerspectiveCamera,
  spec: ReturnType<typeof getCameraViewSpec>,
  goalPosition: Vector3,
  goalLookAt: Vector3,
  currentLookAt: Vector3,
  snap: boolean,
) {
  goalPosition.set(spec.position[0], spec.position[1], spec.position[2]);
  goalLookAt.set(spec.lookAt[0], spec.lookAt[1], spec.lookAt[2]);
  camera.fov = spec.fov;
  camera.updateProjectionMatrix();
  if (snap) {
    camera.position.copy(goalPosition);
    currentLookAt.copy(goalLookAt);
    camera.lookAt(currentLookAt);
  }
}

export function SimCameraRig({
  approach,
  mode,
}: {
  approach: JunctionApproach;
  mode: SimulationCameraMode;
}) {
  const { camera } = useThree();
  const initialSpec = getCameraViewSpec(approach, mode);
  const goalPosition = useRef(new Vector3(...initialSpec.position));
  const goalLookAt = useRef(new Vector3(...initialSpec.lookAt));
  const currentLookAt = useRef(new Vector3(...initialSpec.lookAt));

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    try {
      const spec = getCameraViewSpec(approach, mode);
      applyCameraSpec(camera, spec, goalPosition.current, goalLookAt.current, currentLookAt.current, true);
    } catch {
      /* retain current camera on invalid spec */
    }
  }, [approach, mode, camera]);

  useFrame((_, delta) => {
    if (mode === 'top-down') return;
    const t = Math.min(1, delta * 2.2);
    camera.position.lerp(goalPosition.current, t);
    currentLookAt.current.lerp(goalLookAt.current, t);
    camera.lookAt(currentLookAt.current);
  });

  if (mode === 'top-down') {
    return (
      <OrbitControls
        enablePan
        enableRotate
        maxPolarAngle={Math.PI / 2.05}
        minDistance={18}
        maxDistance={55}
        target={[0, 0, 0]}
      />
    );
  }

  return null;
}
