import { MeshReflectorMaterial } from "@react-three/drei";
import { useMemo } from "react";

type Props = { isMobile: boolean };

/**
 * Virtual Career Studio: reflective floor, industrial walls, mezzanine
 * catwalk, workstation desks, wall lamps, emissive rails.
 */
export function StudioEnvironment({ isMobile }: Props) {
  const length = 40;
  const halfLen = length / 2;

  const ceilingLamps = useMemo(() => {
    const spacing = isMobile ? 5 : 4;
    const count = Math.ceil(length / spacing);
    return Array.from({ length: count }, (_, i) => -halfLen + i * spacing + spacing / 2);
  }, [halfLen, isMobile]);

  const wallPanels = useMemo(() => {
    const spacing = 3;
    const count = Math.ceil(length / spacing);
    return Array.from({ length: count }, (_, i) => -halfLen + i * spacing + spacing / 2);
  }, [halfLen]);

  return (
    <group>
      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -halfLen + length / 2]} receiveShadow>
        <planeGeometry args={[22, length]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={isMobile ? 256 : 512}
          mixBlur={1}
          mixStrength={30}
          roughness={0.75}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#EEF2F7"
          metalness={0.6}
          mirror={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4.5, -halfLen + length / 2]}>
        <boxGeometry args={[22, 0.2, length]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-10.5, 1.15, -halfLen + length / 2]}>
        <boxGeometry args={[0.4, 6.8, length]} />
        <meshStandardMaterial color="#F1F5F9" roughness={0.55} metalness={0.55} />
      </mesh>

      {/* Right wall */}
      <mesh position={[10.5, 1.15, -halfLen + length / 2]}>
        <boxGeometry args={[0.4, 6.8, length]} />
        <meshStandardMaterial color="#F1F5F9" roughness={0.55} metalness={0.55} />
      </mesh>

      {/* Neon amber rails */}
      <mesh position={[-10.28, -1.9, -halfLen + length / 2]}>
        <boxGeometry args={[0.06, 0.08, length]} />
        <meshBasicMaterial color="#0891B2" toneMapped={false} />
      </mesh>
      <mesh position={[10.28, -1.9, -halfLen + length / 2]}>
        <boxGeometry args={[0.06, 0.08, length]} />
        <meshBasicMaterial color="#2563EB" toneMapped={false} />
      </mesh>

      {/* Mezzanine catwalk (upper platform on right side) */}
      <mesh position={[7.5, 1.1, -14]}>
        <boxGeometry args={[5, 0.12, 8]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* Mezzanine railing */}
      <mesh position={[5.05, 1.6, -14]}>
        <boxGeometry args={[0.05, 1, 8]} />
        <meshBasicMaterial color="#2563EB" toneMapped={false} />
      </mesh>

      {/* Stair (simple) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[4.5, -1.7 + i * 0.28, -10 + i * 0.4]}>
          <boxGeometry args={[1.2, 0.08, 0.5]} />
          <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Workstation desks */}
      {[-6, -22].map((z, i) => (
        <group key={i} position={[-6, -1.5, z]}>
          <mesh>
            <boxGeometry args={[3, 0.1, 1.4]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.5, -0.3]}>
            <boxGeometry args={[1.6, 0.9, 0.05]} />
            <meshStandardMaterial
              color="#F1F5F9"
              emissive="#2563EB"
              emissiveIntensity={0.4}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* Wall panel details */}
      {wallPanels.map((z) => (
        <group key={`panel-${z}`}>
          <mesh position={[-10.29, 1, z]}>
            <boxGeometry args={[0.02, 5, 0.06]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[10.29, 1, z]}>
            <boxGeometry args={[0.02, 5, 0.06]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Ceiling lamps */}
      {ceilingLamps.map((z, i) => (
        <group key={`lamp-${i}`} position={[0, 4.38, z]}>
          <mesh>
            <boxGeometry args={[3, 0.06, 0.35]} />
            <meshBasicMaterial color="#A78BFA" toneMapped={false} />
          </mesh>
          {!isMobile && i % 2 === 0 && (
            <pointLight position={[0, -0.4, 0]} intensity={5} distance={11} color="#A78BFA" decay={2} />
          )}
        </group>
      ))}

      {isMobile &&
        ceilingLamps
          .filter((_, i) => i % 3 === 0)
          .map((z, i) => (
            <pointLight
              key={`mlp-${i}`}
              position={[0, 3.8, z]}
              intensity={4}
              distance={12}
              color="#A78BFA"
              decay={2}
            />
          ))}

      {/* Ambient */}
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#A78BFA", "#EEF2F7", 0.35]} />
    </group>
  );
}
