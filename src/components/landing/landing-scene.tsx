import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Float, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Group } from "three";

type CareerModelProps = {
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  floatSpeed?: number;
};

function CareerModel({
  path,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  floatSpeed = 1.2,
}: CareerModelProps) {
  const { scene } = useGLTF(path);

  return (
    <Float
      speed={floatSpeed}
      rotationIntensity={0.15}
      floatIntensity={0.3}
      floatingRange={[-0.12, 0.12]}
    >
      <group position={position} rotation={rotation} scale={scale}>
        <Center>
          <primitive object={scene.clone()} />
        </Center>
      </group>
    </Float>
  );
}

function CareerOrbit() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef} rotation={[0.05, -0.35, 0]}>
      <CareerModel
        path="/models/careers/programmer-laptop.glb"
        position={[-1.65, 0.65, 0]}
        rotation={[0.05, 0.4, -0.08]}
        scale={0.9}
      />

      <CareerModel
        path="/models/careers/designer-tablet.glb"
        position={[1.45, 0.75, -0.25]}
        rotation={[-0.05, -0.55, 0.08]}
        scale={0.85}
        floatSpeed={1}
      />

      <CareerModel
        path="/models/careers/data-chart.glb"
        position={[0.15, -1.25, 0.35]}
        rotation={[0.1, 0.1, 0]}
        scale={0.85}
        floatSpeed={1.4}
      />

      <mesh position={[0, 0, -0.7]}>
        <sphereGeometry args={[1.15, 48, 48]} />

        <meshPhysicalMaterial
          color="#7c3aed"
          transparent
          opacity={0.08}
          roughness={0.35}
          metalness={0.05}
          transmission={0.25}
          thickness={0.8}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.3, 0.008, 8, 100]} />

        <meshBasicMaterial color="#7c3aed" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={1.6} />

      <directionalLight position={[4, 5, 4]} intensity={2.5} />

      <directionalLight position={[-4, 1, 2]} intensity={1.2} />

      <pointLight
        position={[0, -2, 3]}
        intensity={8}
        distance={8}
        color="#7c3aed"
      />

      <Suspense fallback={null}>
        <CareerOrbit />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        autoRotate={false}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.75}
      />
    </>
  );
}

export function LandingScene() {
  return (
    <div
      className="
        relative h-full w-full overflow-hidden
        rounded-[2rem]
      "
      aria-hidden="true"
    >
      <div
        className="
          pointer-events-none absolute inset-8
          rounded-full bg-accent/10 blur-3xl
        "
      />

      <Canvas
        camera={{
          position: [0, 0.15, 7],
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/careers/programmer-laptop.glb");
useGLTF.preload("/models/careers/designer-tablet.glb");
useGLTF.preload("/models/careers/data-chart.glb");
