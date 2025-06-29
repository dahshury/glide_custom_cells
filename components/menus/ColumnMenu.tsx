import React, { useCallback, useEffect, useState } from "react";
import { BaseColumnProps } from "../core/types";
import { FormattingMenu } from "./FormattingMenu";
import {
  ChevronRight,
  ArrowUpward,
  ArrowDownward,
  FormatListNumbered,
  UnfoldMore,
  PushPin,
  VisibilityOff,
  Close,
} from "@emotion-icons/material-outlined";

export interface ColumnMenuProps {
  column: BaseColumnProps;
  position: { x: number; y: number };
  onClose: () => void;
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  onPin?: (columnId: string, side: "left" | "right") => void;
  onUnpin?: (columnId: string) => void;
  onHide?: (columnId: string) => void;
  onAutosize?: (columnId: string) => void;
  onChangeFormat?: (columnId: string, format: string) => void;
  isPinned?: "left" | "right" | false;
  sortDirection?: "asc" | "desc" | null;
  isDarkTheme?: boolean;
}

export function ColumnMenu({
  column,
  position,
  onClose,
  onSort,
  onPin,
  onUnpin,
  onHide,
  onAutosize,
  onChangeFormat,
  isPinned = false,
  sortDirection = null,
  isDarkTheme = false,
}: ColumnMenuProps) {
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menu = document.getElementById("column-menu");
      const formatMenu = document.getElementById("formatting-menu");
      if (menu && !menu.contains(target) && (!formatMenu || !formatMenu.contains(target))) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [onClose]);

  const handleSort = useCallback((direction: "asc" | "desc") => {
    if (onSort) {
      onSort(column.id, direction);
    }
    onClose();
  }, [onSort, column.id, onClose]);

  const handlePin = useCallback((side: "left" | "right") => {
    if (onPin) {
      onPin(column.id, side);
    }
    onClose();
  }, [onPin, column.id, onClose]);

  const handleUnpin = useCallback(() => {
    if (onUnpin) {
      onUnpin(column.id);
    }
    onClose();
  }, [onUnpin, column.id, onClose]);

  const handleHide = useCallback(() => {
    if (onHide) {
      onHide(column.id);
    }
    onClose();
  }, [onHide, column.id, onClose]);

  const handleAutosize = useCallback(() => {
    if (onAutosize) {
      onAutosize(column.id);
    }
    onClose();
  }, [onAutosize, column.id, onClose]);

  const handleFormatChange = useCallback((format: string) => {
    if (onChangeFormat) {
      onChangeFormat(column.id, format);
    }
    onClose();
  }, [onChangeFormat, column.id, onClose]);

  const handleFormatMenuEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setFormatMenuOpen(true);
  };

  const handleFormatMenuLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setFormatMenuOpen(false);
    }, 150); // 150ms delay
  };

  /* ---------- adaptive positioning ---------- */
  const MENU_WIDTH = 220;
  const SUBMENU_WIDTH = 200;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 0;

  const leftOverflow = position.x + MENU_WIDTH > viewportW;
  const menuLeft = leftOverflow ? Math.max(position.x - MENU_WIDTH, 8) : position.x;

  const calcSubmenuLeft = (base: number) => {
    if (leftOverflow) return base - SUBMENU_WIDTH + 10; // Overlap when on left
    return base + MENU_WIDTH - 18; // 2px closer overlap
  };

  const bgColor = isDarkTheme ? "#2a2a2a" : "white";
  const borderColor = isDarkTheme ? "#3a3a3a" : "#e1e1e1";
  const hoverBg = isDarkTheme ? "#3a3a3a" : "#f0f0f0";
  const textColor = isDarkTheme ? "#f1f1f1" : "#333";

  return (
    <div
      id="column-menu"
      className="column-menu"
      style={{
        position: "fixed",
        top: position.y,
        left: menuLeft,
        backgroundColor: bgColor,
        border: `0.5px solid ${isDarkTheme ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        minWidth: "200px",
        zIndex: 1000,
        padding: "4px 0",
        animation: "menuSlideIn 150ms ease-out",
        transformOrigin: "top left",
      }}
    >
      {onSort && (
        <>
          <MenuItem
            icon={<ArrowUpward size={16} />}
            label="Sort ascending"
            onClick={() => handleSort("asc")}
            active={sortDirection === "asc"}
            hoverBg={hoverBg}
            textColor={textColor}
          />
          <MenuItem
            icon={<ArrowDownward size={16} />}
            label="Sort descending"
            onClick={() => handleSort("desc")}
            active={sortDirection === "desc"}
            hoverBg={hoverBg}
            textColor={textColor}
          />
          <MenuDivider color={borderColor} />
        </>
      )}

      {onChangeFormat && ((column as any).dataType === "number" || (column as any).dataType === "date" || (column as any).dataType === "time") && (
        <div
          onMouseEnter={handleFormatMenuEnter}
          onMouseLeave={handleFormatMenuLeave}
        >
          <MenuItem
            icon={<FormatListNumbered size={16} />}
            label="Format"
            hasSubmenu
            active={formatMenuOpen}
            hoverBg={hoverBg}
            textColor={textColor}
          />
          {formatMenuOpen && (
            <>
              {/* invisible bridge to allow mouse movement without gap */}
              <div
                onMouseEnter={handleFormatMenuEnter}
                onMouseLeave={handleFormatMenuLeave}
                style={{
                  position: "fixed",
                  top: position.y + (onSort ? 73 : 4),
                  left: leftOverflow ? menuLeft - SUBMENU_WIDTH - 4 : menuLeft + MENU_WIDTH - 8,
                  width: leftOverflow ? SUBMENU_WIDTH + 4 : 8,
                  height: 32, // Height of menu item
                  zIndex: 999,
                }}
              />
              <FormattingMenu
                column={column}
                position={{ 
                  x: calcSubmenuLeft(menuLeft), 
                  y: position.y + (onSort ? 73 : 4) // Sort: 2 items (32px each) + divider (5px) + top padding (4px)
                }}
                onFormatChange={handleFormatChange}
                onClose={() => setFormatMenuOpen(false)}
                isDarkTheme={isDarkTheme}
                parentTimeoutRef={closeTimeoutRef}
              />
            </>
          )}
        </div>
      )}

      {onAutosize && (
        <MenuItem
          icon={<UnfoldMore size={16} />}
          label="Autosize column"
          onClick={handleAutosize}
          hoverBg={hoverBg}
          textColor={textColor}
        />
      )}

      {isPinned ? (
        <MenuItem
          icon={<Close size={16} />}
          label="Unpin column"
          onClick={handleUnpin}
          hoverBg={hoverBg}
          textColor={textColor}
        />
      ) : (
        <MenuItem
          icon={<PushPin size={16} />}
          label="Pin column"
          onClick={() => handlePin("left")}
          hoverBg={hoverBg}
          textColor={textColor}
        />
      )}

      {onHide && (
        <MenuItem
          icon={<VisibilityOff size={16} />}
          label="Hide column"
          onClick={handleHide}
          hoverBg={hoverBg}
          textColor={textColor}
        />
      )}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  hasSubmenu?: boolean;
  active?: boolean;
  hoverBg: string;
  textColor: string;
}

function MenuItem({ icon, label, onClick, hasSubmenu, active, hoverBg, textColor }: MenuItemProps) {
  return (
    <div
      className={`menu-item ${active ? "active" : ""}`}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        cursor: "pointer",
        backgroundColor: active ? hoverBg : "transparent",
        color: textColor,
        fontSize: "14px",
        justifyContent: hasSubmenu ? "space-between" : "flex-start",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        {label}
      </div>
      {hasSubmenu && <ChevronRight size={16} />}
    </div>
  );
}

function MenuDivider({ color }: { color: string }) {
  return (
    <div
      style={{
        height: "1px",
        backgroundColor: color,
        margin: "4px 0",
      }}
    />
  );
} 