import React from "react";
import {
  Add,
  Search,
  Delete,
  FileDownload,
  Visibility,
  Fullscreen,
  FullscreenExit,
  Close,
  Undo,
  Redo,
} from "@emotion-icons/material-outlined";
import { CompactSelection } from "@glideapps/glide-data-grid";
import { Theme } from "@glideapps/glide-data-grid";

interface GridToolbarProps {
  isFullscreen: boolean;
  isFocused: boolean;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasHiddenColumns: boolean;
  theme: Partial<Theme>;
  darkTheme: Partial<Theme>;
  iconColor: string;
  onClearSelection: () => void;
  onDeleteRows: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddRow: () => void;
  onToggleColumnVisibility: () => void;
  onDownloadCsv: () => void;
  onToggleSearch: () => void;
  onToggleFullscreen: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const GridToolbar: React.FC<GridToolbarProps> = ({
  isFullscreen,
  isFocused,
  hasSelection,
  canUndo,
  canRedo,
  hasHiddenColumns,
  theme,
  darkTheme,
  iconColor,
  onClearSelection,
  onDeleteRows,
  onUndo,
  onRedo,
  onAddRow,
  onToggleColumnVisibility,
  onDownloadCsv,
  onToggleSearch,
  onToggleFullscreen,
  onMouseEnter,
  onMouseLeave,
}) => {
  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 1000,
      }
    : {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "8px",
      };

  const toolbarStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    boxShadow: "1px 2px 8px rgba(0, 0, 0, 0.08)",
    borderRadius: "6px",
    backgroundColor:
      theme === darkTheme ? "rgba(10, 10, 10, 0.95)" : "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    padding: "3px",
    opacity: isFocused || isFullscreen ? 1 : 0,
    transition: isFocused || isFullscreen ? "opacity 150ms ease-in" : "opacity 600ms ease-out",
    pointerEvents: "auto",
    transform: "scale(0.8)",
    transformOrigin: isFullscreen ? "top right" : "bottom right",
  };

  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  const buttonStyle = (buttonId: string): React.CSSProperties => ({
    background: hoveredButton === buttonId 
      ? theme === darkTheme ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
      : "transparent",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    color: hoveredButton === buttonId
      ? theme === darkTheme ? "#ffffff" : "#000000"
      : iconColor,
    borderRadius: "4px",
    transition: "all 150ms ease",
    transform: hoveredButton === buttonId ? "scale(1.1)" : "scale(1)",
  });

  const disabledButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: "4px",
    cursor: "not-allowed",
    color: iconColor,
    opacity: 0.4,
    borderRadius: "4px",
  };

  return (
    <div style={containerStyle}>
      <div 
        style={toolbarStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {hasSelection && (
          <>
            <button
              onClick={onClearSelection}
              title="Clear selection"
              style={buttonStyle("clear")}
              onMouseEnter={() => setHoveredButton("clear")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Close size={20} />
            </button>
            <button
              onClick={onDeleteRows}
              title="Delete rows"
              style={buttonStyle("delete")}
              onMouseEnter={() => setHoveredButton("delete")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Delete size={20} />
            </button>
          </>
        )}

        <button
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          style={canUndo ? buttonStyle("undo") : disabledButtonStyle}
          onMouseEnter={() => canUndo && setHoveredButton("undo")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Undo size={18} style={{ opacity: 0.8 }} />
        </button>

        <button
          onClick={onRedo}
          title="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          style={canRedo ? buttonStyle("redo") : disabledButtonStyle}
          onMouseEnter={() => canRedo && setHoveredButton("redo")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Redo size={18} style={{ opacity: 0.8 }} />
        </button>

        {!hasSelection && (
          <button
            onClick={onAddRow}
            title="Add row"
            style={buttonStyle("add")}
            onMouseEnter={() => setHoveredButton("add")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Add size={20} />
          </button>
        )}

        {hasHiddenColumns && (
          <button
            onClick={onToggleColumnVisibility}
            title="Show/hide columns"
            style={buttonStyle("visibility")}
            onMouseEnter={() => setHoveredButton("visibility")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Visibility size={20} />
          </button>
        )}

        <button
          onClick={onDownloadCsv}
          title="Download as CSV"
          style={buttonStyle("download")}
          onMouseEnter={() => setHoveredButton("download")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FileDownload size={20} />
        </button>

        <button
          onClick={onToggleSearch}
          title="Search"
          style={buttonStyle("search")}
          onMouseEnter={() => setHoveredButton("search")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Search size={20} />
        </button>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Close fullscreen" : "Fullscreen"}
          style={buttonStyle("fullscreen")}
          onMouseEnter={() => setHoveredButton("fullscreen")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {isFullscreen ? <FullscreenExit size={20} /> : <Fullscreen size={20} />}
        </button>
      </div>
    </div>
  );
}; 