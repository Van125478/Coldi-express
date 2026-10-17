import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { RefObject } from "react";
import { Director } from "@/features/guest/cinematic/ColdChainWorld";

type SceneCanvasProps = {
  progress: RefObject<number>;
  quality: "full" | "light";
};

export default function SceneCanvas({ progress, quality }: SceneCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        camera={{ position: [0.4, 1.85, 8.4], fov: 36, near: 0.1, far: 80 }}
        shadows={quality === "full"}
        dpr={quality === "full" ? [1, 1.6] : [1, 1.15]}
        frameloop={visible ? "always" : "demand"}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Director progress={progress} quality={quality} />
      </Canvas>
    </div>
  );
}
