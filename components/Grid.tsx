// @ts-nocheck
import React from "react";
import DataEditor, {
  GridCell,
  GridCellKind,
  Item,
  GridColumn,
  Theme,
  EditableGridCell,
  GridSelection,
  CompactSelection,
  GridMouseEventArgs,
  GetRowThemeCallback,
  SpriteMap,
} from "@glideapps/glide-data-grid";
import { DropdownCell as DropdownRenderer } from "@glideapps/glide-data-grid-cells";
import TempusDateCellRenderer, { type TempusDateCell } from "./TempusDominusDateCell";
import PhoneInputCellRenderer, { type PhoneInputCell } from "./PhoneInputCell";
import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";

const initialNumRows = 10; // Reduced to 10 rows

// Dark theme overrides for the grid
const darkTheme: Partial<Theme> = {
  accentColor: "#4F5DFF",
  accentLight: "rgba(79, 93, 255, 0.2)",
  accentMedium: "rgba(79, 118, 255, 0.5)",
  textDark: "#e8e8e8",
  textMedium: "#9e9e9e",
  textLight: "#6e6e6e",
  textHeader: "#d0d0d0",
  textHeaderSelected: "#ffffff",
  bgCell: "#1e1e1e",
  bgCellMedium: "#2a2a2a",
  bgHeader: "#333333",
  bgHeaderHasFocus: "#3b3b3b",
  bgHeaderHovered: "#404040",
  bgBubble: "#2a2a2a",
  bgBubbleSelected: "#4F5DFF",
  bgSearchResult: "rgba(79, 93, 255, 0.3)",
  borderColor: "#444444",
  drilldownBorder: "#666666",
  linkColor: "#7c9cff",
  cellHorizontalPadding: 8,
  cellVerticalPadding: 3,
  headerFontStyle: "600 13px",
  baseFontStyle: "13px",
  fontFamily: "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif",
};

// Light theme with comprehensive text colors for dropdowns and all components
const lightTheme: Partial<Theme> = {
  textDark: "#000000",           // Black text for light theme dropdowns and primary text
  textMedium: "#333333",         // Dark gray for secondary text
  textLight: "#666666",          // Medium gray for tertiary text
  textHeader: "#333333",         // Dark text for headers
  textHeaderSelected: "#000000", // Black text for selected headers
  bgCell: "#ffffff",             // White background for cells
  bgCellMedium: "#f8f9fa",       // Light gray for medium cells
  bgHeader: "#f1f3f4",           // Light gray for headers
  bgHeaderHasFocus: "#e8eaed",   // Slightly darker for focused headers
  bgHeaderHovered: "#e8eaed",    // Hover state for headers
  bgBubble: "#ffffff",           // White background for dropdowns/bubbles
  bgBubbleSelected: "#4F5DFF",   // Blue for selected items
  borderColor: "#dadce0",        // Light border color
  linkColor: "#1a73e8",          // Blue for links
};

// Create custom renderers array with only the needed ones
const customRenderers = [DropdownRenderer, TempusDateCellRenderer, PhoneInputCellRenderer];

// Sample data generator - simplified for remaining columns
const generateSampleData = (row: number, col: number): any => {
  const seed = row * 1000 + col;
  const random = () => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  switch (col) {
    case 0: return `Text ${row + 1}`;
    case 1: return ["Option A", "Option B", "Option C"][Math.floor(random() * 3)];
    case 2: return new Date(2020 + Math.floor(random() * 4), Math.floor(random() * 12), Math.floor(random() * 28) + 1);
    case 3: return new Date(1970, 0, 1, Math.floor(random() * 24), Math.floor(random() * 60));
    case 4: return `+1${Math.floor(4160000000 + random() * 1000000000)}`;
    default: return `Cell ${row},${col}`;
  }
};

// Hook for keyboard event listener
const useEventListener = (eventName: string, handler: (event: any) => void, element = window, passive = false, capture = false) => {
  React.useEffect(() => {
    if (!element?.addEventListener) return;
    
    element.addEventListener(eventName, handler, { passive, capture });
    return () => element.removeEventListener(eventName, handler, { passive, capture });
  }, [eventName, handler, element, passive, capture]);
};

export default function Grid() {
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [selection, setSelection] = React.useState<GridSelection>({
    rows: CompactSelection.empty(),
    columns: CompactSelection.empty(),
  });
  const [rowSelection, setRowSelection] = React.useState<CompactSelection>(CompactSelection.empty());
  const [hoverRow, setHoverRow] = React.useState<number | undefined>(undefined);
  const [theme, setTheme] = React.useState<Partial<Theme>>(darkTheme);
  const [numRows, setNumRows] = React.useState(initialNumRows);

  // Track which columns have been manually resized
  const hasResized = React.useRef(new Set<number>());

  // Store cell data for editing
  const cellData = React.useRef(new Map<string, any>());

  // Apply theme class to document root for CSS variables
  React.useEffect(() => {
    const isDark = theme === darkTheme;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  // Add CSS overrides for dropdown text color based on theme
  React.useEffect(() => {
    const styleId = 'dropdown-theme-override';
    let existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    
    if (theme === lightTheme) {
      // Light theme: ensure dropdown text is black
      style.textContent = `
        .gdg-growing-entry .gdg-input,
        .gdg-growing-entry input,
        .gdg-growing-entry select,
        .gdg-growing-entry textarea,
        [class*="react-select"] .gdg-input,
        [class*="react-select"] input,
        [class*="react-select"] [class*="singleValue"],
        [class*="react-select"] [class*="placeholder"],
        [class*="react-select"] [class*="option"],
        [class*="react-select"] [class*="menu"] {
          color: #000000 !important;
        }
        
        [class*="react-select"] [class*="menu"] {
          background-color: #ffffff !important;
        }
        
        [class*="react-select"] [class*="option"]:hover {
          background-color: #f0f0f0 !important;
          color: #000000 !important;
        }
        
        [class*="react-select"] [class*="option--is-selected"] {
          background-color: #4F5DFF !important;
          color: #ffffff !important;
        }
      `;
    } else {
      // Dark theme: ensure dropdown text is light
      style.textContent = `
        .gdg-growing-entry .gdg-input,
        .gdg-growing-entry input,
        .gdg-growing-entry select,
        .gdg-growing-entry textarea,
        [class*="react-select"] .gdg-input,
        [class*="react-select"] input,
        [class*="react-select"] [class*="singleValue"],
        [class*="react-select"] [class*="placeholder"],
        [class*="react-select"] [class*="option"],
        [class*="react-select"] [class*="menu"] {
          color: #e8e8e8 !important;
        }
        
        [class*="react-select"] [class*="menu"] {
          background-color: #2a2a2a !important;
        }
        
        [class*="react-select"] [class*="option"]:hover {
          background-color: #404040 !important;
          color: #e8e8e8 !important;
        }
        
        [class*="react-select"] [class*="option--is-selected"] {
          background-color: #4F5DFF !important;
          color: #ffffff !important;
        }
      `;
    }
    
    document.head.appendChild(style);
    
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [theme]); // Re-run when theme changes

  // Keyboard shortcut for search (Ctrl+F / Cmd+F)
  useEventListener(
    "keydown",
    React.useCallback((event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyF") {
        setShowSearch(cv => !cv);
        event.stopPropagation();
        event.preventDefault();
      }
    }, []),
    window,
    false,
    true
  );

  // Header icons for each column type
  const headerIcons = React.useMemo<SpriteMap>(() => {
    return {
      text: p => `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="${p.bgColor}"/>
        <path d="M6 7h8M6 10h6M6 13h4" stroke="${p.fgColor}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      dropdown: p => `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="${p.bgColor}"/>
        <path d="M6 8h8M6 11h6" stroke="${p.fgColor}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="m13 9 2 2-2 2" stroke="${p.fgColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      date: p => `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="${p.bgColor}"/>
        <path d="M6 6v2M14 6v2M4 10h12" stroke="${p.fgColor}" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="4" y="4" width="12" height="12" rx="2" stroke="${p.fgColor}" stroke-width="1.5"/>
      </svg>`,
      time: p => `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="${p.bgColor}"/>
        <circle cx="10" cy="10" r="6" stroke="${p.fgColor}" stroke-width="1.5"/>
        <path d="M10 7v3l2 2" stroke="${p.fgColor}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      phone: p => `<svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="${p.bgColor}"/>
        <path d="M7 4h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="${p.fgColor}" stroke-width="1.5"/>
        <path d="M9 14h2" stroke="${p.fgColor}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`
    };
  }, []);

  // Simplified columns - only text, dropdown, date, time, phone
  const columns: GridColumn[] = React.useMemo(
    () => [
      { title: "Name", width: 200, id: "text", icon: "text" },
      { title: "Dropdown", width: 180, id: "dropdown", icon: "dropdown" },
      { title: "Date", width: 160, id: "date", icon: "date" },
      { title: "Time", width: 140, id: "time", icon: "time" },
      { title: "Phone", width: 126, id: "phone", icon: "phone" }, // Reduced by ~30% (from 180px to 126px)
    ].map((col, i) => ({
      ...col,
      // Add grow property - columns grow proportionally until manually resized
      grow: hasResized.current.has(i) ? undefined : (5 + i) / 5,
    })),
    [hasResized.current.size] // Re-compute when resize tracking changes
  );

  // Filter data based on search
  const filteredRowCount = React.useMemo(() => {
    if (searchValue.length === 0) return numRows;
    
    let matchCount = 0;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < columns.length; col++) {
        const cellKey = `${col}-${row}`;
        const cellValue = cellData.current.get(cellKey);
        const data = cellValue !== undefined ? cellValue : generateSampleData(row, col);
        const cellText = String(data).toLowerCase();
        if (cellText.includes(searchValue.toLowerCase())) {
          matchCount++;
          break; // Found match in this row, move to next row
        }
      }
    }
    return matchCount;
  }, [searchValue, columns.length, numRows]);

  // Get filtered row indices
  const filteredRows = React.useMemo(() => {
    if (searchValue.length === 0) return Array.from({ length: numRows }, (_, i) => i);
    
    const matches: number[] = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < columns.length; col++) {
        const cellKey = `${col}-${row}`;
        const cellValue = cellData.current.get(cellKey);
        const data = cellValue !== undefined ? cellValue : generateSampleData(row, col);
        const cellText = String(data).toLowerCase();
        if (cellText.includes(searchValue.toLowerCase())) {
          matches.push(row);
          break; // Found match in this row, move to next row
        }
      }
    }
    return matches;
  }, [searchValue, columns.length, numRows]);

  const getCellContent = React.useCallback((cell: Item): GridCell => {
    const [col, displayRow] = cell;
    
    // Map display row to actual row index when filtering
    const actualRow = searchValue.length === 0 ? displayRow : filteredRows[displayRow];
    if (actualRow === undefined) {
      return { kind: GridCellKind.Text, data: "", displayData: "", allowOverlay: false };
    }

    // Check if we have edited data for this cell
    const cellKey = `${col}-${actualRow}`;
    const cellValue = cellData.current.get(cellKey);
    const data = cellValue !== undefined ? cellValue : generateSampleData(actualRow, col);

    switch (col) {
      case 0: // Text
        return {
          kind: GridCellKind.Text,
          data: data,
          displayData: data,
          allowOverlay: true,
        };
      case 1: // Dropdown
        return {
          kind: GridCellKind.Custom,
          data: {
            kind: "dropdown-cell",
            allowedValues: ["Option A", "Option B", "Option C"],
            value: data,
          },
          copyData: data,
          allowOverlay: true,
        } as any;
      case 2: // Date Picker (Date)
        return {
          kind: GridCellKind.Custom,
          data: {
            kind: "tempus-date-cell",
            format: "date",
            date: data,
            displayDate: data instanceof Date ? data.toLocaleDateString() : "",
            isDarkTheme: theme === darkTheme, // Pass current theme state
          },
          copyData: data instanceof Date ? data.toLocaleDateString() : "",
          allowOverlay: true,
        } as TempusDateCell;
      case 3: // Time Picker (Time)
        return {
          kind: GridCellKind.Custom,
          data: {
            kind: "tempus-date-cell",
            format: "time",
            date: data,
            displayDate: data instanceof Date ? data.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : "",
            isDarkTheme: theme === darkTheme, // Pass current theme state
          },
          copyData: data instanceof Date ? data.toLocaleTimeString() : "",
          allowOverlay: true,
        } as TempusDateCell;
      case 4: // Phone
        return {
          kind: GridCellKind.Custom,
          data: {
            kind: "phone-input-cell",
            phone: data,
            displayPhone: data,
            isDarkTheme: theme === darkTheme,
          },
          copyData: data,
          allowOverlay: true,
        } as PhoneInputCell;
      default:
        return {
          kind: GridCellKind.Text,
          data: data,
          displayData: data,
          allowOverlay: true,
        };
    }
  }, [searchValue, filteredRows, numRows, theme]); // Add theme to dependencies

  const onCellEdited = React.useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col, displayRow] = cell;
    const actualRow = searchValue.length === 0 ? displayRow : filteredRows[displayRow];
    
    if (actualRow !== undefined) {
      const cellKey = `${col}-${actualRow}`;
      
      // Store the edited value
      if (newValue.kind === GridCellKind.Text) {
        cellData.current.set(cellKey, newValue.data);
      } else if (newValue.kind === GridCellKind.Custom) {
        if (DropdownRenderer.isMatch && DropdownRenderer.isMatch(newValue)) {
          cellData.current.set(cellKey, (newValue as any).data.value);
        } else if (TempusDateCellRenderer.isMatch && TempusDateCellRenderer.isMatch(newValue)) {
          cellData.current.set(cellKey, (newValue as any).data.date);
        } else if (PhoneInputCellRenderer.isMatch && PhoneInputCellRenderer.isMatch(newValue)) {
          cellData.current.set(cellKey, (newValue as any).data.phone);
        }
      }
      
      console.log("Cell edited:", cell, newValue);
    }
  }, [searchValue, filteredRows]);

  // Handle row hover for hover effect
  const onItemHovered = React.useCallback((args: GridMouseEventArgs) => {
    const [_, row] = args.location;
    setHoverRow(args.kind !== "cell" ? undefined : row);
  }, []);

  // Get row theme override for hover effect
  const getRowThemeOverride = React.useCallback<GetRowThemeCallback>(row => {
    if (row !== hoverRow) return undefined;
    
    // Different hover colors for light and dark themes
    if (theme === darkTheme) {
      return {
        bgCell: "#404040",
        bgCellMedium: "#383838"
      };
    } else {
      return {
        bgCell: "#f7f7f7",
        bgCellMedium: "#f0f0f0"
      };
    }
  }, [hoverRow, theme]);

  // Validate cell content - specifically for name validation in text column
  const validateCell = React.useCallback((cell: Item, newValue: EditableGridCell) => {
    const [col] = cell;
    
    // Column 0 – Name validation
    if (col === 0 && newValue.kind === GridCellKind.Text) {
      const name = newValue.data.trim();

      // Empty not allowed
      if (!name) return false;
      if (/\d/.test(name)) return false; // No numbers

      const words = name.split(/\s+/).filter(w => w.length > 0);
      if (words.length < 2) return false;
      for (const w of words) {
        if (w.length < 2 || !/^[\p{L}]+$/u.test(w)) return false;
      }

      const capitalized = words
        .map(w => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase())
        .join(" ");
      if (capitalized !== name) {
        return { ...newValue, data: capitalized };
      }
      return true;
    }

    // Column 4 – Phone: accept all; renderer will show invalid numbers in red
    if (col === 4) {
      return true;
    }

    return true; // All other cells valid by default
  }, []);

  // Handle column resize with grow tracking
  const onColumnResize = React.useCallback((column: GridColumn, newSize: number, colIndex: number, newSizeWithGrow: number) => {
    // Mark this column as manually resized
    hasResized.current.add(colIndex);
    
    // Log the resize for debugging
    console.log(`Column ${colIndex} (${column.title}) resized to ${newSizeWithGrow}px`);
    
    // Force re-render to update grow properties
    // This will cause columns to recalculate without grow for resized columns
  }, []);

  // Handle adding new rows
  const onRowAppended = React.useCallback(() => {
    const newRow = numRows;
    setNumRows(cv => cv + 1);
    
    // Initialize new row with appropriate default values for each column type
    for (let c = 0; c < columns.length; c++) {
      const cellKey = `${c}-${newRow}`;
      let defaultValue: any;
      
      switch (c) {
        case 0: // Text
          defaultValue = "";
          break;
        case 1: // Dropdown
          defaultValue = "";
          break;
        case 2: // Date
          defaultValue = new Date();
          break;
        case 3: // Time
          defaultValue = new Date();
          break;
        case 4: // Phone
          defaultValue = "";
          break;
        default:
          defaultValue = "";
          break;
      }
      
      cellData.current.set(cellKey, defaultValue);
    }
  }, [numRows, columns.length]);

  // Calculate dynamic height based on data
  const calculateGridHeight = () => {
    const headerHeight = 36; // Default header height
    const rowHeight = 34; // Default row height
    const trailingRowHeight = 34; // Height for the implicit "add row" line

    // Grid height = header + all data rows + one trailing row
    return headerHeight + filteredRowCount * rowHeight + trailingRowHeight;
  };

  // Calculate dynamic width based on columns
  const calculateGridWidth = () => {
    return columns.reduce((total, col) => total + (col.width || 150), 0) + 50; // Extra padding
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Theme Controls */}
      <div style={{ 
        padding: "16px", 
        marginBottom: "16px", 
        backgroundColor: theme === darkTheme ? "#2a2a2a" : "#f5f5f5",
        borderRadius: "8px",
        display: "flex",
        gap: "12px",
        alignItems: "center"
      }}>
        <span style={{ color: theme === darkTheme ? "#e8e8e8" : "#333" }}>
          Theme:
        </span>
        <button 
          onClick={() => setTheme(lightTheme)}
          style={{
            padding: "8px 16px",
            backgroundColor: theme === lightTheme ? "#4F5DFF" : "transparent",
            color: theme === lightTheme ? "white" : (theme === darkTheme ? "#e8e8e8" : "#333"),
            border: "1px solid #4F5DFF",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Light
        </button>
        <button 
          onClick={() => setTheme(darkTheme)}
          style={{
            padding: "8px 16px",
            backgroundColor: theme === darkTheme ? "#4F5DFF" : "transparent",
            color: theme === darkTheme ? "white" : (theme === darkTheme ? "#e8e8e8" : "#333"),
            border: "1px solid #4F5DFF",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Dark
        </button>
        <span style={{ 
          marginLeft: "auto", 
          color: theme === darkTheme ? "#9e9e9e" : "#666",
          fontSize: "14px"
        }}>
          Rows: {numRows} | Press Ctrl+F to search
        </span>
      </div>

      {/* Data Grid */}
      <div
        style={{
          width: "100%",
          height: "auto",
          overflow: "hidden", // Clip grid corners
          borderRadius: "8px", // Rounded corners
          boxShadow:
            theme === darkTheme
              ? "0 0 0 1px #444" // Subtle outline in dark mode
              : "0 0 0 1px #dadce0", // Subtle outline in light mode
        }}
      >
        <DataEditor
          getCellContent={getCellContent}
          columns={columns}
          rows={filteredRowCount}
          width="100%"
          height={calculateGridHeight()}
          smoothScrollX={false}
          smoothScrollY={false}
          theme={theme}
          customRenderers={customRenderers}
          getCellsForSelection={true}
          gridSelection={selection}
          onGridSelectionChange={setSelection}
          onCellEdited={onCellEdited}
          onColumnResize={onColumnResize}
          onRowAppended={onRowAppended}
          onItemHovered={onItemHovered}
          getRowThemeOverride={getRowThemeOverride}
          headerIcons={headerIcons}
          validateCell={validateCell}
          rowMarkers="both"
          rowSelect="multi"
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          showSearch={showSearch}
          onSearchClose={() => {
            setShowSearch(false);
            setSearchValue("");
          }}
          searchResults={[]} // Could implement specific search result highlighting here
        />
      </div>
    </div>
  );
} 