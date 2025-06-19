import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface FullscreenContextShape {
  isFullscreen: boolean;
  width: number;
  height: number;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextShape | undefined>(undefined);

export const FullscreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const enterFullscreen = useCallback(() => {
    document.body.style.overflow = "hidden";
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    document.body.style.overflow = "unset";
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "unset";
      return next;
    });
  }, []);

  // Listen for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, exitFullscreen]);

  // Update window dimensions on resize for consumers that need it
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const value: FullscreenContextShape = {
    isFullscreen,
    width: windowSize.width,
    height: windowSize.height,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };

  return <FullscreenContext.Provider value={value}>{children}</FullscreenContext.Provider>;
};

export function useFullscreen() {
  const ctx = useContext(FullscreenContext);
  if (!ctx) {
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  }
  return ctx;
} 