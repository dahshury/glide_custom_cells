import React from "react";

interface FullscreenWrapperProps {
  isFullscreen: boolean;
  theme: any;
  darkTheme: any;
  children: React.ReactNode;
}

export const FullscreenWrapper: React.FC<FullscreenWrapperProps> = ({
  isFullscreen,
  theme,
  darkTheme,
  children,
}) => {
  if (!isFullscreen) {
    return <>{children}</>;
  }

  const isDark = theme === darkTheme;
  
  const wrapperStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
    zIndex: 999,
    padding: "40px",
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const contentStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "1400px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
  };

  return (
    <div style={wrapperStyle}>
      <div style={contentStyle}>
        {children}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          color: isDark ? "#666" : "#999",
          fontSize: "12px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        Press ESC to exit fullscreen
      </div>
    </div>
  );
}; 