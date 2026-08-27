import { LiquidMetal } from "@paper-design/shaders-react";

export default function DastaranLogo() {
  return (
    <div
      className="relative size-32 overflow-hidden rounded-xl sm:size-48
        md:size-72"
      role="img"
      aria-label="Dastaran logo"
    >
      <LiquidMetal
        image="/Dastaran_removebg.png"
        colorBack="#ffffff00"
        colorTint="#ffffff"
        repetition={2}
        softness={0.1}
        distortion={0.07}
        contour={0.4}
        angle={70}
        speed={1}
        scale={1.2}
        fit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
