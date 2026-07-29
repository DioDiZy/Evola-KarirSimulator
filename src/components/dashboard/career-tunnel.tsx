import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdaptiveDpr,
  ScrollControls,
  useScroll,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CareerScreen,
  type CareerTunnelField,
} from "./career-screen";
import { TunnelEnvironment } from "./tunnel-environment";

export type { CareerTunnelField };

const ACCENTS = [
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#A78BFA",
  "#65A30D",
];

/**
 * Maksimal bidang yang dapat dijelajahi.
 * Index 0–3 berarti bidang pertama hingga bidang keempat.
 */
const MAX_VISIBLE_FIELDS = 4;

/**
 * Jarak antarbidang pada sumbu Z.
 */
const Z_SPACING = 7;

/**
 * Posisi awal kamera.
 * Nilai lebih besar membuat kamera lebih jauh dari bidang pertama.
 */
const CAMERA_START_Z = 1.5;

/**
 * Posisi bidang pertama.
 * Jarak awal kamera ke bidang pertama:
 * 1.5 - (-7) = 8.5 unit.
 */
const FIRST_FIELD_Z = -7;

/**
 * Arah pandangan kamera ke depan.
 */
const CAMERA_LOOK_AHEAD = 8.5;

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");

    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl")),
    );
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
  onIndexChange: (index: number) => void;
  onActivate: (slug: string) => void;
}) {
  const scroll = useScroll();
  const { camera, pointer } = useThree();

  const lastIndex = useRef(-1);
  const swayTime = useRef(0);

  /**
   * Tidak ada tambahan jarak setelah bidang terakhir.
   * Untuk 4 bidang:
   * (4 - 1) × 7 = 21 unit.
   */
  const totalTravel = Math.max(
    0,
    fields.length - 1,
  ) * Z_SPACING;

  useFrame((_, delta) => {
    swayTime.current += delta;

    const normalizedOffset = THREE.MathUtils.clamp(
      scroll.offset,
      0,
      1,
    );

    /**
     * Kamera dimulai dari CAMERA_START_Z dan berhenti
     * tepat sejajar dengan bidang terakhir.
     */
    const targetZ =
      CAMERA_START_Z -
      normalizedOffset * totalTravel;

    const targetX = isMobile
      ? 0
      : pointer.x * 0.4 +
        Math.sin(swayTime.current * 0.4) * 0.1;

    const targetY = isMobile
      ? 0.15
      : 0.15 +
        pointer.y * 0.2 +
        Math.cos(swayTime.current * 0.3) * 0.05;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX,
      3,
      delta,
    );

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetY,
      3,
      delta,
    );

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetZ,
      4,
      delta,
    );

    camera.lookAt(
      camera.position.x * 0.3,
      0,
      camera.position.z - CAMERA_LOOK_AHEAD,
    );

    /**
     * Menentukan bidang aktif berdasarkan posisi kamera.
     * Posisi kamera ideal untuk bidang ke-i:
     * CAMERA_START_Z - i × Z_SPACING.
     */
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (
      let index = 0;
      index < fields.length;
      index += 1
    ) {
      const fieldCameraZ =
        CAMERA_START_Z - index * Z_SPACING;

      const distance = Math.abs(
        camera.position.z - fieldCameraZ,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    if (nearestIndex !== lastIndex.current) {
      lastIndex.current = nearestIndex;
      onIndexChange(nearestIndex);
    }
  });

  const initialDistance =
    CAMERA_START_Z - FIRST_FIELD_Z;

  const tunnelLength =
    totalTravel + initialDistance + 20;

  return (
    <>
      <TunnelEnvironment
        length={tunnelLength}
        isMobile={isMobile}
      />

      {fields.map((field, index) => {
        const side = isMobile
          ? 0
          : index % 2 === 0
            ? 1
            : -1;

        const x = isMobile ? 0 : side * 3.4;

        const z =
          FIRST_FIELD_Z -
          index * Z_SPACING;

        const rotationY = isMobile
          ? 0
          : side === 1
            ? -Math.PI / 6.5
            : Math.PI / 6.5;

        const accent =
          ACCENTS[index % ACCENTS.length];

        return (
          <group
            key={field.id}
            scale={isMobile ? 0.78 : 1}
          >
            <CareerScreen
              field={field}
              index={index}
              total={fields.length}
              position={[x, 0.2, z]}
              rotationY={rotationY}
              accent={accent}
              onActivate={onActivate}
            />
          </group>
        );
      })}
    </>
  );
}

function FallbackGrid({
  fields,
}: {
  fields: CareerTunnelField[];
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-ink-dim">
        Perangkat Anda menggunakan mode sederhana.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => {
          const active =
            field.status === "active";

          const content = (
            <div
              className={`surface-panel flex min-h-[200px] flex-col justify-between p-6 transition ${
                active
                  ? "hover:border-accent"
                  : "opacity-60"
              }`}
            >
              <div>
                <span className="eyebrow">
                  {active
                    ? "Aktif"
                    : "Segera Hadir"}
                </span>

                <h3 className="mt-4 font-display text-2xl">
                  {field.name}
                </h3>

                <p className="mt-2 text-sm text-ink-dim">
                  {field.tagline}
                </p>
              </div>

              {active && (
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
                  Buka
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          );

          return active ? (
            <Link
              key={field.id}
              to="/fields/$fieldSlug"
              params={{
                fieldSlug: field.slug,
              }}
            >
              {content}
            </Link>
          ) : (
            <div key={field.id}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CareerTunnel({
  fields,
}: {
  fields: CareerTunnelField[];
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [webglStatus, setWebglStatus] =
    useState<
      "checking" | "ok" | "unsupported"
    >("checking");

  const [activeIndex, setActiveIndex] =
    useState(0);

  /**
   * Hanya empat bidang pertama yang dimasukkan
   * ke dalam tunnel.
   */
  const visibleFields = useMemo(
    () => fields.slice(0, MAX_VISIBLE_FIELDS),
    [fields],
  );

  useEffect(() => {
    setWebglStatus(
      checkWebGL()
        ? "ok"
        : "unsupported",
    );
  }, []);

  useEffect(() => {
    setActiveIndex((currentIndex) =>
      Math.min(
        currentIndex,
        Math.max(0, visibleFields.length - 1),
      ),
    );
  }, [visibleFields.length]);

  const onActivate = useMemo(
    () => (slug: string) => {
      navigate({
        to: "/fields/$fieldSlug",
        params: {
          fieldSlug: slug,
        },
      });
    },
    [navigate],
  );

  if (webglStatus === "checking") {
    return (
      <div className="h-[60vh] sm:h-[70vh] rounded-2xl bg-background-secondary animate-pulse" />
    );
  }

  if (
    webglStatus === "unsupported" ||
    visibleFields.length === 0
  ) {
    return (
      <FallbackGrid
        fields={visibleFields}
      />
    );
  }

  const safeActiveIndex = Math.min(
    activeIndex,
    visibleFields.length - 1,
  );

  const active =
    visibleFields[safeActiveIndex];

  /**
   * Jumlah halaman scroll mengikuti jumlah bidang.
   * Pergerakan kamera tetap dibatasi di Rig.
   */
  const scrollPages = Math.max(
    2,
    visibleFields.length,
  );

  return (
    <div className="relative">
      <div className="relative h-[70vh] sm:h-[80vh] min-h-[440px] overflow-hidden rounded-2xl border border-line bg-background-secondary">

        <Canvas
          dpr={[1, 1.5]}
          camera={{
            position: [
              0,
              0.3,
              CAMERA_START_Z,
            ],
            fov: isMobile ? 58 : 46,
            near: 0.1,
            far: 150,
          }}
          gl={{
            powerPreference:
              "high-performance",
            antialias: !isMobile,
            alpha: false,
          }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping =
              THREE.ACESFilmicToneMapping;

            gl.outputColorSpace =
              THREE.SRGBColorSpace;

            scene.fog = new THREE.Fog(
              "#F8FAFC",
              10,
              38,
            );
          }}
        >
          <AdaptiveDpr pixelated />

          <ScrollControls
            pages={scrollPages}
            damping={0.25}
            distance={1}
          >
            <Rig
              fields={visibleFields}
              isMobile={isMobile}
              onIndexChange={setActiveIndex}
              onActivate={onActivate}
            />
          </ScrollControls>

          {!isMobile && (
            <EffectComposer>
              <Bloom
                intensity={0.6}
                luminanceThreshold={0.35}
                luminanceSmoothing={0.9}
                mipmapBlur
              />

              <Noise opacity={0.04} />

              <Vignette
                eskil={false}
                offset={0.15}
                darkness={0.85}
              />
            </EffectComposer>
          )}
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
          <div>
            <p className="eyebrow text-white/70">
              Bidang
            </p>

            <p className="mt-1 font-display text-xl text-white">
              {active?.name}
            </p>
          </div>

          <p className="font-mono text-sm text-white/70">
            {String(
              safeActiveIndex + 1,
            ).padStart(2, "0")}{" "}
            /{" "}
            {String(
              visibleFields.length,
            ).padStart(2, "0")}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Scroll to explore
          </p>
        </div>
      </div>

      <nav
        aria-label="Bidang karier"
        className="sr-only"
      >
        <ul>
          {visibleFields.map((field) => (
            <li key={field.id}>
              {field.status === "active" ? (
                <Link
                  to="/fields/$fieldSlug"
                  params={{
                    fieldSlug:
                      field.slug,
                  }}
                >
                  {field.name}
                </Link>
              ) : (
                <span>
                  {field.name} (segera hadir)
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}