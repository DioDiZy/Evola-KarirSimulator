import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, ScrollControls, useScroll } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CareerScreen, type CareerTunnelField } from "./career-screen";
export type { CareerTunnelField };
import { TunnelEnvironment } from "./tunnel-environment";

const ACCENTS = ["#7dd3fc", "#bef2de", "#a78bfa", "#38bdf8", "#f472b6", "#fbbf24"];
const Z_SPACING = 7;
const Z_START = -4;

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

function Rig({
  fields,
  isMobile,
  onIndexChange,
  onActivate,
}: {
  fields: CareerTunnelField[];
  isMobile: boolean;
  onIndexChange: (i: number) => void;
  onActivate: (slug: string) => void;
}) {
  const scroll = useScroll();
  const { camera, pointer } = useThree();
  const totalZ = (fields.length - 1) * Z_SPACING + 6;
  const lastIndex = useRef(-1);
  const sway = useRef(0);

  useFrame((_, dt) => {
    sway.current += dt;
    const offset = scroll.offset;
    const targetZ = Z_START - offset * totalZ;
    const swayX = isMobile ? 0 : pointer.x * 0.4 + Math.sin(sway.current * 0.4) * 0.1;
    const swayY = isMobile ? 0 : pointer.y * 0.2 + Math.cos(sway.current * 0.3) * 0.05;
    camera.position.x += (swayX - camera.position.x) * Math.min(1, dt * 3);
    camera.position.y += (swayY - camera.position.y) * Math.min(1, dt * 3);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 4);
    camera.lookAt(camera.position.x * 0.3, 0, camera.position.z - 4);

    // active index
    const zPos = camera.position.z;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < fields.length; i++) {
      const fz = Z_START - 3 - i * Z_SPACING;
      const d = Math.abs(fz - (zPos - 3));
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx !== lastIndex.current) {
      lastIndex.current = bestIdx;
      onIndexChange(bestIdx);
    }
  });

  const tunnelLength = totalZ + 20;

  return (
    <>
      <TunnelEnvironment length={tunnelLength} isMobile={isMobile} />
      {fields.map((f, i) => {
        const side = isMobile ? 0 : i % 2 === 0 ? 1 : -1;
        const x = side * (isMobile ? 0 : 3.4);
        const z = Z_START - 3 - i * Z_SPACING;
        const rotY = isMobile ? 0 : side === 1 ? -Math.PI / 6.5 : Math.PI / 6.5;
        const accent = ACCENTS[i % ACCENTS.length];
        return (
          <group key={f.id} scale={isMobile ? 0.78 : 1}>
            <CareerScreen
              field={f}
              index={i}
              total={fields.length}
              position={[x, 0.2, z]}
              rotationY={rotY}
              accent={accent}
              onActivate={onActivate}
            />
          </group>
        );
      })}
    </>
  );
}

function FallbackGrid({ fields }: { fields: CareerTunnelField[] }) {
  return (
    <div>
      <p className="text-sm text-ink-dim mb-4">Perangkat Anda menggunakan mode sederhana.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((f) => {
          const active = f.status === "active";
          const inner = (
            <div className={`surface-panel p-6 min-h-[200px] flex flex-col justify-between transition ${active ? "hover:border-accent" : "opacity-60"}`}>
              <div>
                <span className="eyebrow">{active ? "Aktif" : "Segera Hadir"}</span>
                <h3 className="mt-4 font-display text-2xl">{f.name}</h3>
                <p className="mt-2 text-sm text-ink-dim">{f.tagline}</p>
              </div>
              {active && (
                <span className="text-accent text-sm inline-flex items-center gap-1 mt-4">
                  Buka <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          );
          return active ? (
            <Link key={f.id} to="/fields/$fieldSlug" params={{ fieldSlug: f.slug }}>{inner}</Link>
          ) : (
            <div key={f.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

export function CareerTunnel({ fields }: { fields: CareerTunnelField[] }) {
  const isMobile = useIsMobile();
  const [webglStatus, setWebglStatus] = useState<"checking" | "ok" | "unsupported">("checking");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setWebglStatus(checkWebGL() ? "ok" : "unsupported");
  }, []);

  const onActivate = useMemo(
    () => (slug: string) => { navigate({ to: "/fields/$fieldSlug", params: { fieldSlug: slug } }); },
    [navigate]
  );

  if (webglStatus === "checking") {
    return <div className="h-[70vh] rounded-2xl bg-gradient-to-b from-[#03060c] to-[#02060c] animate-pulse" />;
  }

  if (webglStatus === "unsupported" || fields.length === 0) {
    return <FallbackGrid fields={fields} />;
  }

  const active = fields[activeIndex];

  return (
    <div className="relative">
      <div className="relative h-[80vh] min-h-[520px] rounded-2xl overflow-hidden border border-white/5 bg-[#02060c]">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.3, Z_START], fov: isMobile ? 58 : 46 }}
          gl={{ powerPreference: "high-performance", antialias: !isMobile, alpha: false }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            scene.fog = new THREE.Fog("#02060c", 8, 32);
          }}
        >
          <AdaptiveDpr pixelated />
          <ScrollControls pages={Math.max(2, fields.length * 0.9)} damping={0.25}>
            <Rig fields={fields} isMobile={isMobile} onIndexChange={setActiveIndex} onActivate={onActivate} />
          </ScrollControls>
          {!isMobile && (
            <EffectComposer>
              <Bloom intensity={0.6} luminanceThreshold={0.35} luminanceSmoothing={0.9} mipmapBlur />
              <Noise opacity={0.04} />
              <Vignette eskil={false} offset={0.15} darkness={0.85} />
            </EffectComposer>
          )}
        </Canvas>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
          <div>
            <p className="eyebrow text-white/70">Bidang</p>
            <p className="font-display text-xl text-white mt-1">{active?.name}</p>
          </div>
          <p className="font-mono text-sm text-white/70">
            {String(activeIndex + 1).padStart(2, "0")} / {String(fields.length).padStart(2, "0")}
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Scroll to explore</p>
        </div>
      </div>

      {/* Screen-reader accessible navigation */}
      <nav aria-label="Bidang karier" className="sr-only">
        <ul>
          {fields.map((f) => (
            <li key={f.id}>
              {f.status === "active" ? (
                <Link to="/fields/$fieldSlug" params={{ fieldSlug: f.slug }}>{f.name}</Link>
              ) : (
                <span>{f.name} (segera hadir)</span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
