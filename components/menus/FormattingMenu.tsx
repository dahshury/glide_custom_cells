import React, { useCallback, useEffect } from "react";
import { BaseColumnProps } from "../core/types";
import {
  Schedule,
  Translate,
  Speed,
  AttachMoney,
  Euro,
  Science,
  AccountBalance,
  Today,
} from "@emotion-icons/material-outlined";

interface FormatOption {
  format: string;
  label: string;
  icon: React.ReactNode;
}

const NUMBER_FORMATS: FormatOption[] = [
  {
    format: "automatic",
    label: "Automatic",
    icon: <Schedule size={16} />,
  },
  {
    format: "localized",
    label: "Localized",
    icon: <Translate size={16} />,
  },
  {
    format: "plain",
    label: "Plain",
    icon: <Speed size={16} />,
  },
  {
    format: "compact",
    label: "Compact",
    icon: <Speed size={16} />,
  },
  {
    format: "dollar",
    label: "Dollar",
    icon: <AttachMoney size={16} />,
  },
  {
    format: "euro",
    label: "Euro",
    icon: <Euro size={16} />,
  },
  {
    format: "yen",
    label: "Yen",
    icon: <Euro size={16} />,
  },
  {
    format: "percent",
    label: "Percent",
    icon: <Speed size={16} />,
  },
  {
    format: "scientific",
    label: "Scientific",
    icon: <Science size={16} />,
  },
  {
    format: "accounting",
    label: "Accounting",
    icon: <AccountBalance size={16} />,
  },
];

const DATETIME_FORMATS: FormatOption[] = [
  {
    format: "automatic",
    label: "Automatic",
    icon: <Schedule size={16} />,
  },
  {
    format: "localized",
    label: "Localized",
    icon: <Translate size={16} />,
  },
  {
    format: "distance",
    label: "Distance",
    icon: <Today size={16} />,
  },
  {
    format: "calendar",
    label: "Calendar",
    icon: <Today size={16} />,
  },
];

const DATE_FORMATS: FormatOption[] = [
  {
    format: "automatic",
    label: "Automatic",
    icon: <Schedule size={16} />,
  },
  {
    format: "localized",
    label: "Localized",
    icon: <Translate size={16} />,
  },
  {
    format: "distance",
    label: "Distance",
    icon: <Today size={16} />,
  },
];

const TIME_FORMATS: FormatOption[] = [
  {
    format: "automatic",
    label: "Automatic",
    icon: <Schedule size={16} />,
  },
  {
    format: "localized",
    label: "Localized",
    icon: <Translate size={16} />,
  },
];

const COLUMN_KIND_FORMAT_MAPPING: Record<string, FormatOption[]> = {
  number: NUMBER_FORMATS,
  progress: NUMBER_FORMATS,
  datetime: DATETIME_FORMATS,
  date: DATE_FORMATS,
  time: TIME_FORMATS,
};

export interface FormattingMenuProps {
  column: BaseColumnProps;
  position: { x: number; y: number };
  onFormatChange: (format: string) => void;
  onClose: () => void;
  isDarkTheme?: boolean;
  parentTimeoutRef?: React.MutableRefObject<NodeJS.Timeout | null>;
}

export function FormattingMenu({
  column,
  position,
  onFormatChange,
  onClose,
  isDarkTheme = false,
  parentTimeoutRef,
}: FormattingMenuProps) {
  const formats = getFormatsForColumn(column);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menu = document.getElementById("formatting-menu");
      if (menu && !menu.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleFormatSelect = useCallback((format: string) => {
    onFormatChange(format);
    onClose();
  }, [onFormatChange, onClose]);

  const bgColor = isDarkTheme ? "#2a2a2a" : "white";
  const borderColor = isDarkTheme ? "#3a3a3a" : "#e1e1e1";
  const hoverBg = isDarkTheme ? "#3a3a3a" : "#f0f0f0";
  const textColor = isDarkTheme ? "#f1f1f1" : "#333";

  const handleMouseEnter = () => {
    // Clear parent timeout to keep menu open when mouse enters
    if (parentTimeoutRef?.current) {
      clearTimeout(parentTimeoutRef.current);
      parentTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Close the menu when mouse leaves the submenu
    onClose();
  };

  if (formats.length === 0) {
    return null;
  }

  return (
    <div
      id="formatting-menu"
      className="formatting-menu"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        minWidth: "180px",
        zIndex: 1001,
        padding: "4px 0",
      }}
    >
      {formats.map((formatOption) => (
        <FormatMenuItem
          key={formatOption.format}
          icon={formatOption.icon}
          label={formatOption.label}
          onClick={() => handleFormatSelect(formatOption.format)}
          hoverBg={hoverBg}
          textColor={textColor}
        />
      ))}
    </div>
  );
}

interface FormatMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hoverBg: string;
  textColor: string;
}

function FormatMenuItem({ icon, label, onClick, hoverBg, textColor }: FormatMenuItemProps) {
  return (
    <div
      className="format-menu-item"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        cursor: "pointer",
        backgroundColor: "transparent",
        color: textColor,
        fontSize: "14px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function getFormatsForColumn(column: BaseColumnProps): FormatOption[] {
  // Determine column kind based on column properties or data type
  const columnKind = determineColumnKind(column);
  return COLUMN_KIND_FORMAT_MAPPING[columnKind] || [];
}

function determineColumnKind(column: BaseColumnProps): string {
  const name = (column as any).name ? (column as any).name.toLowerCase() : (column as any).title?.toLowerCase() ?? "";
  const id = (column as any).id ? (column as any).id.toLowerCase() : "";
  
  if (id.includes("number") || name.includes("number") || 
      id.includes("numeric") || name.includes("numeric") ||
      id.includes("float") || name.includes("int")) {
    return "number";
  }
  
  if (id.includes("progress") || name.includes("progress")) {
    return "progress";
  }
  
  if (id.includes("datetime") || name.includes("datetime") ||
      id.includes("timestamp") || name.includes("timestamp")) {
    return "datetime";
  }
  
  if (id.includes("date") || name.includes("date")) {
    return "date";
  }
  
  if (id.includes("time") || name.includes("time")) {
    return "time";
  }
  
  // Default to number for unknown types that might be numeric
  return "number";
} 