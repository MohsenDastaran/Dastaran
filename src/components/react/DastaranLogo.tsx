import { LiquidMetal } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export default function DastaranLogo() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const motion = window.matchMedia(MOTION_QUERY);
    const sync = () => {
      setIsDesktop(desktop.matches);
      setPrefersReducedMotion(motion.matches);
    };
    sync();
    setHasMounted(true);
    desktop.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  const showShader = hasMounted && !prefersReducedMotion;

  return (
    <div
      className="relative size-[min(14rem,calc(100vw-1.5rem))] overflow-hidden
        rounded-xl sm:size-56 md:size-72"
      role="img"
      aria-label="Dastaran logo"
    >
      {showShader ? null : (
        <img
          src="/Dastaran_removebg.png"
          alt=""
          width={288}
          height={288}
          decoding="async"
          className="absolute inset-0 size-full object-contain md:object-cover"
        />
      )}
      {showShader ? (
        <LiquidMetal
          image="/Dastaran_removebg.png"
          colorBack="#ffffff00"
          colorTint="#ffffff"
          repetition={2}
          softness={0.1}
          distortion={isDesktop ? 0.07 : 0.04}
          contour={0.4}
          angle={70}
          speed={isDesktop ? 1 : 0.4}
          scale={isDesktop ? 1.2 : 0.92}
          fit={isDesktop ? "cover" : "contain"}
          minPixelRatio={1}
          maxPixelCount={isDesktop ? undefined : 256 * 256}
          style={{ width: "100%", height: "100%" }}
        />
      ) : null}
    </div>
  );
}
