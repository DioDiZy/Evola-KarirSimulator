import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, ScrollControls, useScroll } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  type CSSProperties,
  type TouchEvent,
  type WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { ArrowRight } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { CareerScreen, type CareerTunnelField } from "./career-screen";
import { TunnelEnvironment } from "./tunnel-environment";

export type { CareerTunnelField };

const ACCENTS = ["#22D3EE", "#3B82F6", "#8B5CF6", "#A78BFA", "#84CC16"];

const MAX_VISIBLE_FIELDS = 4;
const Z_SPACING = 7.5;
const CAMERA_START_Z = 2.5;
const FIRST_FIELD_Z = -8;
const CAMERA_LOOK_AHEAD = 9;
const SCREEN_X_OFFSET = 2.75;

/**
 * Persentase komponen yang harus terlihat sebelum
 * masuk ke mode immersive.
 */
const IMMERSIVE_ENTER_RATIO = 0.72;

/**
 * Batas scroll internal yang dianggap masih berada
 * pada objek atau bidang pertama.
 */
const FIRST_FIELD_OFFSET_THRESHOLD = 0.015;

/**
 * Total scroll-up yang diperlukan sebelum keluar.
 * Nilai lebih besar membuat exit tidak terlalu sensitif.
 */
const EXIT_WHEEL_THRESHOLD = 110;

/**
 * Jarak swipe-down pada mobile untuk keluar.
 */
const EXIT_TOUCH_THRESHOLD = 85;

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");

    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

type RigProps = {
  fields: CareerTunnelField[];
  isMobile: boolean;
  onIndexChange: (index: number) => void;
  onActivate: (slug: string) => void;
  onScrollOffsetChange: (offset: number) => void;
};

function Rig({
  fields,
  isMobile,
  onIndexChange,
  onActivate,
  onScrollOffsetChange,
}: RigProps) {
  const scroll = useScroll();
  const { camera, pointer, size } = useThree();

  const lastIndex = useRef(-1);
  const swayTime = useRef(0);
  const lookTarget = useRef(new THREE.Vector3());

  const totalTravel = Math.max(0, fields.length - 1) * Z_SPACING;

  useFrame((_, delta) => {
    swayTime.current += delta;

    const normalizedOffset = THREE.MathUtils.clamp(scroll.offset, 0, 1);

    onScrollOffsetChange(normalizedOffset);

    const targetZ = CAMERA_START_Z - normalizedOffset * totalTravel;

    const targetX = isMobile
      ? 0
      : pointer.x * 0.22 + Math.sin(swayTime.current * 0.35) * 0.04;

    const targetY = isMobile
      ? 0.15
      : 0.15 + pointer.y * 0.1 + Math.cos(swayTime.current * 0.3) * 0.025;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX,
      3.5,
      delta,
    );

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetY,
      3.5,
      delta,
    );

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetZ,
      4,
      delta,
    );

    lookTarget.current.set(
      camera.position.x * 0.18,
      0.05,
      camera.position.z - CAMERA_LOOK_AHEAD,
    );

    camera.lookAt(lookTarget.current);

    const nearestIndex = Math.min(
      fields.length - 1,
      Math.max(
        0,
        Math.round(normalizedOffset * Math.max(0, fields.length - 1)),
      ),
    );

    if (nearestIndex !== lastIndex.current) {
      lastIndex.current = nearestIndex;
      onIndexChange(nearestIndex);
    }
  });

  const initialDistance = CAMERA_START_Z - FIRST_FIELD_Z;

  const tunnelLength = totalTravel + initialDistance + 20;

  return (
    <>
      <TunnelEnvironment length={tunnelLength} isMobile={isMobile} />

      {fields.map((field, index) => {
        /**
         * Index genap berada di kanan.
         * Index ganjil berada di kiri.
         */
        const side = index % 2 === 0 ? 1 : -1;

        /**
         * Skala panel mengikuti lebar layar mobile.
         *
         * 320px  -> sekitar 0.52
         * 360px  -> sekitar 0.56
         * 430px  -> sekitar 0.67
         *
         * Nilai tetap dibatasi agar tidak terlalu kecil
         * maupun terlalu besar.
         */
        const mobileScale = THREE.MathUtils.clamp(size.width / 640, 0.52, 0.68);

        /**
         * Jarak panel dari tengah juga dibuat responsif.
         * Panel tetap berada di kiri dan kanan, tetapi tidak
         * sampai terpotong terlalu banyak pada layar kecil.
         */
        const mobileXOffset = THREE.MathUtils.clamp(
          size.width / 320,
          1.05,
          1.4,
        );

        const panelScale = isMobile ? mobileScale : 0.9;

        const x = side * (isMobile ? mobileXOffset : SCREEN_X_OFFSET);

        /**
         * Sedikit variasi tinggi agar susunan panel
         * tidak terlihat terlalu kaku.
         */
        const y = isMobile
          ? index % 2 === 0
            ? 0.12
            : 0.22
          : index % 2 === 0
            ? 0.15
            : 0.3;

        const z = FIRST_FIELD_Z - index * Z_SPACING;

        /**
         * Panel tetap menghadap ke arah kamera.
         * Sudut mobile lebih kecil agar teks tetap mudah dibaca.
         */
        const rotationY =
          side === 1
            ? isMobile
              ? -Math.PI / 11
              : -Math.PI / 8
            : isMobile
              ? Math.PI / 11
              : Math.PI / 8;

        const accent = ACCENTS[index % ACCENTS.length];

        return (
          <group key={field.id} scale={panelScale}>
            <CareerScreen
              field={field}
              index={index}
              total={fields.length}
              position={[x, y, z]}
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

function FallbackGrid({ fields }: { fields: CareerTunnelField[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#050816] p-5 text-white sm:p-8">
      <p className="mb-5 text-sm text-slate-400">
        Perangkat Anda menggunakan mode sederhana.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field, index) => {
          const active = field.status === "active";

          const accent = ACCENTS[index % ACCENTS.length];

          const content = (
            <div
              className={[
                "group flex min-h-[220px] flex-col justify-between",
                "overflow-hidden rounded-2xl border border-white/10",
                "bg-[#07111F] p-6",
                "shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]",
                "transition duration-300",
                active
                  ? "hover:-translate-y-1 hover:border-white/20"
                  : "opacity-50",
              ].join(" ")}
            >
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <span
                    className="h-1 w-10 rounded-full"
                    style={{
                      backgroundColor: accent,
                      boxShadow: `0 0 12px ${accent}77`,
                    }}
                  />

                  <span className="font-mono text-xs text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  {active ? "Bidang Aktif" : "Segera Hadir"}
                </span>

                <h3 className="mt-4 font-display text-2xl font-semibold text-white">
                  {field.name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {field.tagline}
                </p>
              </div>

              {active && (
                <span
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: accent }}
                >
                  Jelajahi bidang
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
            <div key={field.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

export function CareerTunnel({ fields }: { fields: CareerTunnelField[] }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  /**
   * Wrapper tetap berada dalam alur halaman.
   * Saat immersive, hanya viewport internal yang menjadi fixed.
   */
  const sectionRef = useRef<HTMLDivElement>(null);

  const storedScrollYRef = useRef(0);
  const exitTargetScrollRef = useRef<number | null>(null);

  const scrollOffsetRef = useRef(0);
  const exitWheelProgressRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  const suppressAutoEnterRef = useRef(false);
  const scrollDirectionRef = useRef<"up" | "down">("down");

  const [webglStatus, setWebglStatus] = useState<
    "checking" | "ok" | "unsupported"
  >("checking");

  const [activeIndex, setActiveIndex] = useState(0);

  const [isImmersive, setIsImmersive] = useState(false);

  const visibleFields = useMemo(
    () => fields.slice(0, MAX_VISIBLE_FIELDS),
    [fields],
  );

  useEffect(() => {
    setWebglStatus(checkWebGL() ? "ok" : "unsupported");
  }, []);

  useEffect(() => {
    setActiveIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(0, visibleFields.length - 1)),
    );
  }, [visibleFields.length]);

  /**
   * Menyimpan arah scroll halaman.
   * Immersive hanya otomatis aktif ketika user
   * mencapai panel saat bergerak ke bawah.
   */
  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - previousScrollY;

      if (Math.abs(difference) > 2) {
        scrollDirectionRef.current = difference > 0 ? "down" : "up";
      }

      previousScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, []);

  /**
   * Mengaktifkan immersive ketika sebagian besar
   * component panel telah masuk viewport.
   */
  useEffect(() => {
    const section = sectionRef.current;

    if (!section || webglStatus !== "ok") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        /**
         * Auto-enter baru diizinkan lagi setelah
         * component benar-benar ditinggalkan.
         */
        if (entry.intersectionRatio < 0.25) {
          suppressAutoEnterRef.current = false;
          return;
        }

        const shouldEnter =
          !isImmersive &&
          !suppressAutoEnterRef.current &&
          scrollDirectionRef.current === "down" &&
          entry.isIntersecting &&
          entry.intersectionRatio >= IMMERSIVE_ENTER_RATIO;

        if (shouldEnter) {
          setIsImmersive(true);
        }
      },
      {
        threshold: [0, 0.25, 0.5, IMMERSIVE_ENTER_RATIO, 1],
        rootMargin: "-2% 0px -2% 0px",
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [isImmersive, webglStatus]);

  /**
   * Mengunci halaman ketika immersive aktif.
   * Posisi halaman tetap disimpan agar tidak melompat.
   */
  useEffect(() => {
    if (!isImmersive) {
      return;
    }

    storedScrollYRef.current = window.scrollY;

    const body = document.body;
    const html = document.documentElement;

    const previousBodyPosition = body.style.position;

    const previousBodyTop = body.style.top;

    const previousBodyLeft = body.style.left;

    const previousBodyRight = body.style.right;

    const previousBodyWidth = body.style.width;

    const previousBodyOverflow = body.style.overflow;

    const previousHtmlOverflow = html.style.overflow;

    const previousBodyOverscroll = body.style.overscrollBehavior;

    const previousHtmlOverscroll = html.style.overscrollBehavior;

    body.style.position = "fixed";
    body.style.top = `-${storedScrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.position = previousBodyPosition;

      body.style.top = previousBodyTop;

      body.style.left = previousBodyLeft;

      body.style.right = previousBodyRight;

      body.style.width = previousBodyWidth;

      body.style.overflow = previousBodyOverflow;

      body.style.overscrollBehavior = previousBodyOverscroll;

      html.style.overflow = previousHtmlOverflow;

      html.style.overscrollBehavior = previousHtmlOverscroll;

      const restoreScrollY =
        exitTargetScrollRef.current ?? storedScrollYRef.current;

      exitTargetScrollRef.current = null;

      requestAnimationFrame(() => {
        window.scrollTo({
          top: restoreScrollY,
          left: 0,
          behavior: "auto",
        });
      });
    };
  }, [isImmersive]);

  const onActivate = useCallback(
    (slug: string) => {
      navigate({
        to: "/fields/$fieldSlug",
        params: {
          fieldSlug: slug,
        },
      });
    },
    [navigate],
  );

  const handleScrollOffsetChange = useCallback((offset: number) => {
    scrollOffsetRef.current = offset;
  }, []);

  /**
   * Keluar immersive dan mengembalikan user
   * sedikit ke atas component agar tidak langsung
   * masuk immersive kembali.
   */
  const exitImmersive = useCallback(() => {
    if (!isImmersive) {
      return;
    }

    suppressAutoEnterRef.current = true;
    exitWheelProgressRef.current = 0;
    touchStartYRef.current = null;

    const section = sectionRef.current;

    if (section) {
      const sectionTop =
        section.getBoundingClientRect().top + storedScrollYRef.current;

      exitTargetScrollRef.current = Math.max(
        0,
        sectionTop - Math.min(window.innerHeight * 0.55, 480),
      );
    } else {
      exitTargetScrollRef.current = Math.max(
        0,
        storedScrollYRef.current - window.innerHeight * 0.5,
      );
    }

    setIsImmersive(false);
  }, [isImmersive]);

  /**
   * Desktop:
   * ketika berada tepat pada bidang pertama,
   * scroll ke atas akan keluar immersive.
   */
  const handleWheelCapture = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (!isImmersive) {
        return;
      }

      const isAtFirstField =
        activeIndex === 0 &&
        scrollOffsetRef.current <= FIRST_FIELD_OFFSET_THRESHOLD;

      if (isAtFirstField && event.deltaY < 0) {
        event.preventDefault();

        exitWheelProgressRef.current += Math.abs(event.deltaY);

        if (exitWheelProgressRef.current >= EXIT_WHEEL_THRESHOLD) {
          event.stopPropagation();
          exitImmersive();
        }

        return;
      }

      exitWheelProgressRef.current = 0;
    },
    [activeIndex, exitImmersive, isImmersive],
  );

  /**
   * Mobile:
   * swipe ke bawah dari bidang pertama
   * akan keluar immersive.
   */
  const handleTouchStartCapture = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!isImmersive) {
        return;
      }

      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    },
    [isImmersive],
  );

  const handleTouchMoveCapture = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!isImmersive || touchStartYRef.current === null) {
        return;
      }

      const currentY = event.touches[0]?.clientY;

      if (currentY === undefined) {
        return;
      }

      const swipeDistance = currentY - touchStartYRef.current;

      const isAtFirstField =
        activeIndex === 0 &&
        scrollOffsetRef.current <= FIRST_FIELD_OFFSET_THRESHOLD;

      if (isAtFirstField && swipeDistance >= EXIT_TOUCH_THRESHOLD) {
        event.preventDefault();
        exitImmersive();
      }
    },
    [activeIndex, exitImmersive, isImmersive],
  );

  const handleTouchEndCapture = useCallback(() => {
    touchStartYRef.current = null;
  }, []);

  if (webglStatus === "checking") {
    return (
      <div className="h-[72vh] min-h-[500px] animate-pulse rounded-3xl border border-white/10 bg-[#050816] sm:h-[82vh] sm:min-h-[580px]" />
    );
  }

  if (webglStatus === "unsupported" || visibleFields.length === 0) {
    return <FallbackGrid fields={visibleFields} />;
  }

  const safeActiveIndex = Math.min(activeIndex, visibleFields.length - 1);

  const active = visibleFields[safeActiveIndex];

  const activeAccent = ACCENTS[safeActiveIndex % ACCENTS.length];

  const scrollPages = Math.max(2, visibleFields.length);

  const scrollStyle: CSSProperties = {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
  };

  return (
    /**
     * Wrapper ini tetap memiliki ukuran normal di halaman.
     * Saat immersive aktif, wrapper menjadi placeholder
     * agar layout halaman tidak berubah.
     */
    <div
      ref={sectionRef}
      className={[
        "relative h-[72vh] min-h-[500px] w-full",
        "sm:h-[82vh] sm:min-h-[580px]",
      ].join(" ")}
    >
      <div
        onWheelCapture={handleWheelCapture}
        onTouchStartCapture={handleTouchStartCapture}
        onTouchMoveCapture={handleTouchMoveCapture}
        onTouchEndCapture={handleTouchEndCapture}
        className={[
          "career-tunnel-viewport",
          "overflow-hidden bg-[#050816]",
          "transition-[border-radius,box-shadow] duration-500",

          isImmersive
            ? [
                "fixed inset-0 z-[9999]",
                "h-[100dvh] w-screen",
                "rounded-none border-0",
                "shadow-none",
              ].join(" ")
            : [
                "absolute inset-0",
                "h-full w-full",
                "rounded-3xl",
                "border border-white/10",
                "shadow-[0_30px_100px_-35px_rgba(0,0,0,0.9)]",
              ].join(" "),
        ].join(" ")}
      >
        <Canvas
          className="absolute inset-0 h-full w-full"
          shadows={!isMobile}
          dpr={isMobile ? [1, 1.2] : [1, 1.5]}
          camera={{
            position: [0, 0.25, CAMERA_START_Z],
            fov: isMobile ? 63 : 50,
            near: 0.1,
            far: 160,
          }}
          gl={{
            powerPreference: "high-performance",
            antialias: !isMobile,
            alpha: false,
          }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;

            gl.toneMappingExposure = 0.68;

            gl.outputColorSpace = THREE.SRGBColorSpace;

            gl.setClearColor(new THREE.Color("#050816"), 1);

            scene.background = new THREE.Color("#050816");

            scene.fog = new THREE.Fog("#07111F", 20, 58);
          }}
        >
          <AdaptiveDpr pixelated />

          <ScrollControls
            pages={scrollPages}
            damping={0.28}
            distance={1}
            style={scrollStyle}
          >
            <Rig
              fields={visibleFields}
              isMobile={isMobile}
              onIndexChange={setActiveIndex}
              onActivate={onActivate}
              onScrollOffsetChange={handleScrollOffsetChange}
            />
          </ScrollControls>

          {!isMobile && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.2}
                luminanceThreshold={0.9}
                luminanceSmoothing={0.2}
                mipmapBlur
              />

              <Noise opacity={0.008} />

              <Vignette eskil={false} offset={0.2} darkness={0.65} />
            </EffectComposer>
          )}
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-[#030712]/95 via-[#050816]/55 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 bg-gradient-to-t from-[#030712]/95 via-[#050816]/60 to-transparent" />

        {/* HUD atas */}
        <div
          className={[
            "pointer-events-none absolute inset-x-0 top-0 z-20",
            "flex items-start justify-between gap-3",
            "px-4 pb-4",
            isImmersive ? "pt-[max(1rem,env(safe-area-inset-top))]" : "pt-4",
            "sm:gap-4 sm:px-6 sm:pb-6",
          ].join(" ")}
        >
          <div
            className={[
              "min-w-0 overflow-hidden rounded-2xl",
              "border border-white/10 bg-[#07111F]/85",
              "px-4 py-3 backdrop-blur-2xl",
              "shadow-[0_16px_50px_-25px_rgba(0,0,0,0.9)]",
              "sm:px-5 sm:py-4",
            ].join(" ")}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: activeAccent,
                  boxShadow: `0 0 14px ${activeAccent}`,
                }}
              />

              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400 sm:text-xs sm:tracking-[0.24em]">
                Bidang Karier
              </p>
            </div>

            <p className="mt-2 max-w-[190px] truncate font-display text-lg font-semibold text-white sm:max-w-[440px] sm:text-2xl">
              {active?.name}
            </p>

            <p className="mt-1 hidden max-w-[440px] truncate text-sm text-slate-400 sm:block">
              {active?.tagline}
            </p>

            <div className="mt-3 h-px w-full overflow-hidden bg-white/10 sm:mt-4">
              <div
                className="h-full w-24"
                style={{
                  background: `linear-gradient(90deg, ${activeAccent}, transparent)`,
                }}
              />
            </div>
          </div>

          <div
            className={[
              "shrink-0 rounded-2xl",
              "border border-white/10 bg-[#07111F]/85",
              "px-3 py-3 text-right backdrop-blur-2xl",
              "shadow-[0_16px_50px_-25px_rgba(0,0,0,0.9)]",
              "sm:px-5 sm:py-4",
            ].join(" ")}
          >
            <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 sm:block sm:text-[10px]">
              Kartu
            </p>

            <p className="font-mono text-sm font-medium text-white sm:mt-1 sm:text-lg">
              {String(safeActiveIndex + 1).padStart(2, "0")}

              <span className="mx-1.5 text-slate-600 sm:mx-2">/</span>

              <span className="text-slate-400">
                {String(visibleFields.length).padStart(2, "0")}
              </span>
            </p>

            <div className="mt-2 flex items-center justify-end gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: activeAccent,
                  boxShadow: `0 0 8px ${activeAccent}`,
                }}
              />

              <p
                className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] sm:block"
                style={{
                  color: activeAccent,
                }}
              >
                {active?.status === "active" ? "Tersedia" : "Akan datang"}
              </p>
            </div>
          </div>
        </div>

        {/* HUD bawah */}
        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 z-20",
            "flex justify-center px-4 pt-4",
            isImmersive ? "pb-[max(1rem,env(safe-area-inset-bottom))]" : "pb-4",
            "sm:px-6 sm:pt-6",
          ].join(" ")}
        >
          <div
            className={[
              "flex w-full max-w-2xl items-center",
              "justify-between gap-4 rounded-2xl",
              "border border-white/10 bg-[#07111F]/85",
              "px-4 py-3 backdrop-blur-2xl",
              "shadow-[0_16px_50px_-25px_rgba(0,0,0,0.9)]",
              "sm:px-5 sm:py-4",
            ].join(" ")}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-5 shrink-0 items-start justify-center rounded-full border border-white/20 pt-1.5">
                <span
                  className="h-1.5 w-1 animate-bounce rounded-full"
                  style={{
                    backgroundColor: activeAccent,
                    boxShadow: `0 0 7px ${activeAccent}`,
                  }}
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[9px] font-medium uppercase tracking-[0.25em] text-slate-300 sm:text-[10px] sm:tracking-[0.28em]">
                  {safeActiveIndex === 0
                    ? "Scroll up to exit"
                    : "Scroll to explore"}
                </p>

                <p className="mt-1 hidden truncate text-xs text-slate-500 sm:block">
                  {safeActiveIndex === 0
                    ? "Scroll ke atas dari bidang pertama untuk kembali ke halaman."
                    : "Jelajahi bidang dan temukan jalur kariermu."}
                </p>
              </div>
            </div>

            <div
              className="flex shrink-0 items-center gap-2"
              aria-hidden="true"
            >
              {visibleFields.map((field, index) => {
                const isActive = index === safeActiveIndex;

                const previous = index < safeActiveIndex;

                return (
                  <span
                    key={field.id}
                    className={[
                      "h-1.5 rounded-full",
                      "transition-all duration-500",
                      isActive ? "w-8" : previous ? "w-3" : "w-2 bg-white/15",
                    ].join(" ")}
                    style={
                      isActive
                        ? {
                            backgroundColor: activeAccent,
                            boxShadow: `0 0 12px ${activeAccent}88`,
                          }
                        : previous
                          ? {
                              backgroundColor: `${activeAccent}66`,
                            }
                          : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>

        <nav aria-label="Bidang karier" className="sr-only">
          <ul>
            {visibleFields.map((field) => (
              <li key={field.id}>
                {field.status === "active" ? (
                  <Link
                    to="/fields/$fieldSlug"
                    params={{
                      fieldSlug: field.slug,
                    }}
                  >
                    {field.name}
                  </Link>
                ) : (
                  <span>{field.name} (segere hadir)</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
