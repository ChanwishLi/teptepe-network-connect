import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Top-of-page progress bar that appears whenever the router is loading a new route.
 */
export function RouteProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      setVisible(true);
      setProgress(10);
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        // Ease toward 90% while loading
        const next = Math.min(90, 10 + (elapsed / 800) * 80);
        setProgress(next);
        if (isLoading) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else if (visible) {
      setProgress(100);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent">
      <div
        className="h-full bg-primary shadow-[0_0_10px_var(--primary),0_0_5px_var(--primary)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1, transitionProperty: "width, opacity" }}
      />
    </div>
  );
}
