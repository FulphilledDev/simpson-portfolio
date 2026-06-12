"use client";

import dynamic from "next/dynamic";

const HeroSceneCanvas = dynamic(() => import("./HeroSceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-hero" />
  ),
});

export default function HeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <HeroSceneCanvas />
    </div>
  );
}
