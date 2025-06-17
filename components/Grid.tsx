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
import DataEditor, {
  DrawCellCallback,
  GetRowThemeCallback,
  GridCellKind,
  Item,
  CompactSelection,
  GridCell,
  GridColumn,
  Theme,
  GridSelection,
  CustomRenderer,
  DrawHeaderCallback,
} from "@glideapps/glide-data-grid";
import { DropdownCell as DropdownRenderer } from "@glideapps/glide-data-grid-cells";
import TempusDateCellRenderer from "./TempusDominusDateCell";
import PhoneInputCellRenderer from "./PhoneInputCell";

import Tooltip from "./Tooltip";
import { ColumnMenu } from "./menus/ColumnMenu";
import { GridState, TooltipData, BaseColumnProps } from "./core/types";
import { useColumnMenu } from "./hooks/useColumnMenu";

import { useGridTheme } from "./hooks/useGridTheme";
import { useGridColumns } from "./hooks/useGridColumns";
import { useGridState } from "./hooks/useGridState";
import { useGridData } from "./hooks/useGridData";
import { useGridTooltips } from "./hooks/useGridTooltips";
import { useGridActions } from "./hooks/useGridActions";
import { useGridEvents } from "./hooks/useGridEvents";
import { useGridLifecycle } from "./hooks/useGridLifecycle";
import { useUndoRedo } from "./hooks/useUndoRedo";

import {
  drawAttentionIndicator,
  drawMissingPlaceholder,
} from "./utils/cellDrawHelpers";
import { extractCellDisplayText } from "./utils/cellTextExtraction";

// Register all custom renderers used by DataEditor
const customRenderers = [
  DropdownRenderer,
  TempusDateCellRenderer,
  PhoneInputCellRenderer,
];

export default function Grid() {
  /* ---------------------------- state & helpers ---------------------------- */
  const gs = useGridState();
  const {
    theme,
    setTheme,
    darkTheme,
    lightTheme,
    iconColor,
  } = useGridTheme();

  const {
    columns,
    columnsState,
    displayColumns,
    visibleColumnIndices,
    onColumnResize,
    setColumns,
    onColumnMoved,
    togglePin,
    pinnedColumns,
  } = useGridColumns(gs.hiddenColumns);

  /* ------------------------------ column menu ------------------------------ */
  const columnMenu = useColumnMenu();

  const {
    getCellContent: baseGetCellContent,
    onCellEdited: baseOnCellEdited,
    getRawCellContent,
  } = useGridData(
    visibleColumnIndices,
    theme,
    darkTheme,
    gs.initialNumRows,
    columnMenu.columnFormats
  );

  /* --------------------------- derived row helpers -------------------------- */
  const [sortState, setSortState] = React.useState<{ columnId: string; direction: "asc" | "desc" } | null>(null);
  const dataEditorRef = React.useRef<any>(null);

  const filteredRows = React.useMemo(() => {
    const out: number[] = [];
    const q = gs.searchValue.toLowerCase();

    for (let row = 0; row < gs.numRows; row++) {
      if (gs.deletedRows.has(row)) continue;
      if (!q) {
        out.push(row);
        continue;
      }
      for (let c = 0; c < displayColumns.length; c++) {
        const colIdx = visibleColumnIndices[c];
        if (colIdx === undefined) continue;
        const cell = getRawCellContent(colIdx, row);
        const txt = (
          (cell as any).displayData ?? (cell as any).data ?? ""
        )
          .toString()
          .toLowerCase();
        if (txt.includes(q)) {
          out.push(row);
          break;
        }
      }
    }

    // Apply sorting if set
    if (sortState) {
      const colIdx = displayColumns.findIndex(c => c.id === sortState.columnId);
      if (colIdx >= 0) {
        out.sort((a, b) => {
          const cellA = getRawCellContent(visibleColumnIndices[colIdx], a);
          const cellB = getRawCellContent(visibleColumnIndices[colIdx], b);

          const digitOnly = (s: string) => s.replace(/\D+/g, "");

          const extractValue = (cell: any) => {
            if (cell.kind === GridCellKind.Number) return cell.data ?? 0;

            if (cell.kind === GridCellKind.Custom) {
              const k = cell.data?.kind;
              switch (k) {
                case "dropdown-cell":
                  return cell.data.value ?? "";
                case "tempus-date-cell":
                  return cell.data.date ?? null; // May be Date or null
                case "phone-input-cell":
                  return cell.data.phone ?? "";
                default:
                  return cell.data ?? cell.displayData ?? "";
              }
            }

            return cell.data ?? cell.displayData ?? "";
          };

          const valA = extractValue(cellA);
          const valB = extractValue(cellB);

          // Date comparison
          if (valA instanceof Date && valB instanceof Date) {
            const comp = valA.getTime() - valB.getTime();
            return sortState.direction === "asc" ? comp : -comp;
          }

          // Numeric comparison (including phone numbers converted to digits)
          const numParse = (v: any) => {
            if (typeof v === "string" && /^[\d\s+()-]+$/.test(v)) {
              const digits = digitOnly(v);
              return digits.length ? Number(digits) : NaN;
            }
            return Number(v);
          };

          const numA = numParse(valA);
          const numB = numParse(valB);

          if (!isNaN(numA) && !isNaN(numB)) {
            const comp = numA - numB;
            return sortState.direction === "asc" ? comp : -comp;
          }

          // Fallback string comparison
          const strA = (valA ?? "").toString().toLowerCase();
          const strB = (valB ?? "").toString().toLowerCase();
          if (strA < strB) return sortState.direction === "asc" ? -1 : 1;
          if (strA > strB) return sortState.direction === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return out;
  }, [
    gs.searchValue,
    gs.deletedRows,
    gs.numRows,
    displayColumns,
    visibleColumnIndices,
    getRawCellContent,
    sortState,
  ]);

  const filteredRowCount = filteredRows.length;

  /* ----------------------- sizing constants ----------------------- */
  const rowHeight = 33;
  const headerHeight = 35;

  const calcHeight = () => headerHeight + filteredRowCount * rowHeight + rowHeight;

  /* -------------------------- wrapped callbacks -------------------------- */
  const getCellContent = React.useCallback(
    (cell: Item) => {
      const baseCell = baseGetCellContent(filteredRows)(cell);
      const [col] = cell;
      const column = displayColumns[col] as any;

      if (column?.sticky) {
        // For text cells, use the built-in "faded" style that glide-data-grid supports.
        if (baseCell.kind === GridCellKind.Text && (baseCell as any).style !== "faded") {
          return { ...(baseCell as any), style: "faded" } as any;
        }

        // For all cells, slightly reduce text contrast to indicate pinning.
        // We clone to avoid mutating the cached cell instance.
        return {
          ...(baseCell as any),
          themeOverride: {
            ...(baseCell as any).themeOverride,
            textDark: theme === darkTheme ? "#a1a1aa" : "#6b7280",
          },
        } as any;
      }

      // If previously pinned cell retained faded style, remove it now
      if (
        baseCell.kind === GridCellKind.Text &&
        ((baseCell as any).style === "faded" || (baseCell as any).themeOverride)
      ) {
        const { style: _s, themeOverride: _t, ...rest } = baseCell as any;
        return { ...rest } as any;
      }

      return baseCell;
    },
    [filteredRows, baseGetCellContent, displayColumns, theme, darkTheme]
  );

  const onCellEdited = React.useCallback(
    (cell: Item, newVal: any) => baseOnCellEdited(filteredRows)(cell, newVal),
    [filteredRows, baseOnCellEdited]
  );

  /* ----------------------------- undo / redo ----------------------------- */
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    onCellEdited: undoOnCellEdited,
    onGridSelectionChange,
  } = useUndoRedo(
    dataEditorRef,
    getCellContent,
    onCellEdited,
    gs.setSelection
  );

  /* ----------------------------- grid actions ----------------------------- */
  const actions = useGridActions(
    columns,
    gs.setHiddenColumns,
    gs.selection,
    gs.setDeletedRows,
    filteredRows,
    gs.numRows,
    getRawCellContent,
    gs.deletedRows,
    columnsState,
    setColumns,
    gs.hiddenColumns
  );

  /* ------------------------------- tooltips ------------------------------- */
  const tooltipMatrix = React.useMemo(() => {
    return filteredRows.map(rowIdx =>
      displayColumns.map((_, cIdx) => {
        const colIdx = visibleColumnIndices[cIdx];
        if (colIdx === undefined) return undefined;
        const cell = getRawCellContent(colIdx, rowIdx);
        return (cell as any).data ?? (cell as any).displayData;
      })
    );
  }, [filteredRows, displayColumns, visibleColumnIndices, getRawCellContent]);

  const { tooltipData, onTooltipHover } = useGridTooltips(
    tooltipMatrix,
    displayColumns
  );

  /* ------------------------- external event hooks ------------------------- */
  useGridEvents(gs.setShowSearch);
  useGridLifecycle(
    gs.isFullscreen,
    gs.showColumnMenu,
    gs.setShowColumnMenu
  );

  /* ------------------------------ draw cell ------------------------------ */
  const drawCell: DrawCellCallback = React.useCallback(
    (args, draw) => {
      const { cell, col } = args;
      const column = displayColumns[col] as any;

      // Only text-kind cells can be marked as missing
      if ((cell as any).isMissingValue) {
        // TODO: Fix drawMissingPlaceholder type compatibility
        // drawMissingPlaceholder(args);
        if ((column as any)?.isRequired && (column as any)?.isEditable) {
          const { ctx, rect } = args;
          drawAttentionIndicator(ctx, rect, theme as any);
        }
        return;
      }
      draw();
    },
    [displayColumns, theme]
  );

  /* ---------------------------- row theming ---------------------------- */
  const getRowThemeOverride: GetRowThemeCallback = React.useCallback(
    row => {
      // Highlight hover row
      if (row === gs.hoverRow) {
        return { 
          bgCell: (theme as any).bgCellMedium, 
          bgCellMedium: (theme as any).bgCellMedium 
        };
      }

      // Style the implicit "+ Add Row" builder row like header
      if (row === filteredRowCount) {
        return {
          bgCell: (theme as any).bgHeader ?? (theme as any).bgCell,
          bgCellMedium: (theme as any).bgHeader ?? (theme as any).bgCellMedium,
          textDark: (theme as any).textHeader,
        } as any;
      }

      return undefined;
    },
    [gs.hoverRow, theme, darkTheme, filteredRowCount]
  );



  /* ---------------------- column menu action handlers --------------------- */
  const handleSort = React.useCallback(
    (columnId: string, direction: "asc" | "desc") => {
      setSortState({ columnId, direction });
    },
    []
  );

  const handlePin = React.useCallback(
    (columnId: string, _side: "left" | "right") => {
      const idx = columns.findIndex(c => c.id === columnId);
      if (idx >= 0) {
        togglePin(idx);
        columnMenu.pinColumn(columnId, "left");
      }
    },
    [columns, togglePin, columnMenu]
  );

  const handleUnpin = React.useCallback((columnId: string) => {
    const idx = columns.findIndex(c => c.id === columnId);
    if (idx >= 0) {
      togglePin(idx);
      columnMenu.unpinColumn(columnId);
    }
  }, [columns, togglePin, columnMenu]);

  const handleHide = React.useCallback((columnId: string) => {
    const idx = columns.findIndex(c => c.id === columnId);
    if (idx >= 0) gs.setHiddenColumns(prev => new Set([...prev, idx]));
  }, [columns, gs]);

  const handleAutosize = React.useCallback((columnId: string) => {
    // Manual autosize implementation since remeasureColumns requires auto-sized columns
    const colIdx = displayColumns.findIndex(c => c.id === columnId);
    if (colIdx < 0) return;

    const actualColIndex = visibleColumnIndices[colIdx];
    if (actualColIndex === undefined) return;

    // Measure content similar to Streamlit's approach but adapted for our setup
    let maxWidth = displayColumns[colIdx].title.length * 8; // Rough character width

    // Sample up to 100 rows for performance
    const sampleSize = Math.min(filteredRows.length, 100);
    for (let i = 0; i < sampleSize; i++) {
      const row = filteredRows[i];
      const cell = getRawCellContent(actualColIndex, row);
      
      // Extract display text from different cell types
      let text = "";
      if (cell.kind === GridCellKind.Text) {
        text = (cell as any).displayData || (cell as any).data || "";
      } else if (cell.kind === GridCellKind.Number) {
        text = String((cell as any).data || "");
      } else if (cell.kind === GridCellKind.Custom) {
        // Handle our custom cell types
        const customData = (cell as any).data;
        if (customData?.kind === "dropdown-cell") {
          text = customData.value || "";
        } else if (customData?.kind === "tempus-date-cell") {
          text = customData.date ? customData.date.toLocaleDateString() : "";
        } else if (customData?.kind === "phone-input-cell") {
          text = customData.phone || "";
        } else {
          text = (cell as any).displayData || (cell as any).data || "";
        }
      }
      
      maxWidth = Math.max(maxWidth, text.length * 8);
    }

    // Add padding and constrain to reasonable bounds
    const newWidth = Math.max(60, Math.min(maxWidth + 32, 400));

    // Update the column width
    setColumns(prev => prev.map((c, idx) => 
      idx === actualColIndex ? { ...c, width: newWidth } : c
    ));
  }, [displayColumns, visibleColumnIndices, setColumns, filteredRows, getRawCellContent]);



  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: theme === darkTheme ? "#1e1e1e" : "#ffffff",
        borderRadius: "12px",
        overflow: "hidden",
      }}
      onMouseEnter={() => gs.setIsFocused(true)}
      onMouseLeave={() => gs.setIsFocused(false)}
    >
      {/* Theme Toggle Bar */}
      <div
        style={{
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: theme === darkTheme ? "#2a2a2a" : "#f5f5f5",
          borderRadius: "8px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span style={{ color: iconColor }}>Theme:</span>
        <button
          onClick={() => setTheme(lightTheme)}
          style={{
            padding: "8px 16px",
            backgroundColor: theme === lightTheme ? "#4F5DFF" : "transparent",
            color: theme === lightTheme ? "white" : iconColor,
            border: "1px solid #4F5DFF",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Light
        </button>
        <button
          onClick={() => setTheme(darkTheme)}
          style={{
            padding: "8px 16px",
            backgroundColor: theme === darkTheme ? "#4F5DFF" : "transparent",
            color: theme === darkTheme ? "white" : iconColor,
            border: "1px solid #4F5DFF",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Dark
        </button>
        <span style={{ marginLeft: "auto", color: iconColor, fontSize: "14px" }}>
          Rows: {filteredRowCount} | Press Ctrl+F to search | Right-click column headers for options
        </span>
      </div>

      {/* Toolbar container - positioned above the grid in normal mode, floating in fullscreen */}
      <div
        style={{
          ...(gs.isFullscreen ? {
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 1000,
          } : {
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "8px",
          }),
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            boxShadow: "1px 2px 8px rgba(0, 0, 0, 0.08)",
            borderRadius: "8px",
            backgroundColor:
              theme === darkTheme ? "rgba(42, 42, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            padding: "4px",
            opacity: gs.isFocused || gs.isFullscreen ? 1 : 0,
            transition: "opacity 150ms ease-in-out",
            pointerEvents: gs.isFocused || gs.isFullscreen ? "auto" : "none",
          }}
        >
          {/* Clear Selection */}
          {actions.hasSelection && (
            <button
              onClick={() => {
                gs.setSelection({
                  rows: CompactSelection.empty(),
                  columns: CompactSelection.empty(),
                });
                gs.setRowSelection(CompactSelection.empty());
              }}
              title="Clear selection"
              style={{
                background: "transparent",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: iconColor,
              }}
            >
              <Close size={20} />
            </button>
          )}

          {/* Delete Rows */}
          {actions.hasSelection && (
            <button
              onClick={() => {
                actions.handleDeleteRows();
                gs.setSelection({ rows: CompactSelection.empty(), columns: CompactSelection.empty() });
                gs.setRowSelection(CompactSelection.empty());
              }}
              title="Delete rows"
              style={{ background: "transparent", border: "none", color: iconColor }}
            >
              <Delete size={20} />
            </button>
          )}

          {/* Undo */}
          <button
            onClick={undo}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: canUndo ? "pointer" : "not-allowed",
              color: iconColor,
              opacity: canUndo ? 1 : 0.4,
            }}
          >
            <Undo size={18} style={{ opacity: 0.8 }} />
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            title="Redo (Ctrl+Shift+Z)"
            disabled={!canRedo}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: canRedo ? "pointer" : "not-allowed",
              color: iconColor,
              opacity: canRedo ? 1 : 0.4,
            }}
          >
            <Redo size={18} style={{ opacity: 0.8 }} />
          </button>

          {/* Add Row */}
          {!actions.hasSelection && (
            <button
              onClick={() => gs.setNumRows((n) => n + 1)}
              title="Add row"
              style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: iconColor }}
            >
              <Add size={20} />
            </button>
          )}

          {/* Column visibility */}
          {columns.length > displayColumns.length && (
            <button
              onClick={actions.handleToggleColumnVisibility}
              title="Show/hide columns"
              style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: iconColor }}
            >
              <Visibility size={20} />
            </button>
          )}

          {/* Download CSV */}
          <button
            onClick={actions.handleDownloadCsv}
            title="Download as CSV"
            style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: iconColor }}
          >
            <FileDownload size={20} />
          </button>

          {/* Search */}
          <button
            onClick={() => gs.setShowSearch((v) => !v)}
            title="Search"
            style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: iconColor }}
          >
            <Search size={20} />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => gs.setIsFullscreen((v) => !v)}
            title={gs.isFullscreen ? "Close fullscreen" : "Fullscreen"}
            style={{ background: "transparent", border: "none", padding: "4px", cursor: "pointer", color: iconColor }}
          >
            {gs.isFullscreen ? <FullscreenExit size={20} /> : <Fullscreen size={20} />}
          </button>
        </div>
      </div>

      {/* DataEditor container */}
      <div
        style={{
          width: "100%",
          height: gs.isFullscreen ? "100vh" : "auto",
          position: gs.isFullscreen ? "fixed" : "relative",
          top: gs.isFullscreen ? 0 : "auto",
          left: gs.isFullscreen ? 0 : "auto",
          right: gs.isFullscreen ? 0 : "auto",
          bottom: gs.isFullscreen ? 0 : "auto",
          zIndex: gs.isFullscreen ? 999 : undefined,
          backgroundColor: gs.isFullscreen
            ? theme === darkTheme
              ? "#1e1e1e"
              : "#ffffff"
            : "transparent",
          padding: gs.isFullscreen ? "60px 20px 20px 20px" : 0,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <DataEditor
          getCellContent={getCellContent}
          columns={displayColumns}
          rows={filteredRowCount}
          width="100%"
          height={gs.isFullscreen ? "calc(100vh - 80px)" : calcHeight()}
          maxColumnAutoWidth={500}
          maxColumnWidth={2000}
          minColumnWidth={20}
          scaleToRem
          theme={theme}
          experimental={{
            disableMinimumCellWidth: true,
          }}
          customRenderers={customRenderers}
          drawCell={drawCell}
          getRowThemeOverride={getRowThemeOverride}
          gridSelection={gs.selection}  
          onGridSelectionChange={onGridSelectionChange}
          freezeColumns={pinnedColumns.length}
          onRowAppended={() => gs.setNumRows((n) => n + 1)}
          onColumnResize={onColumnResize}
          onCellEdited={undoOnCellEdited}
          onItemHovered={(args) => {
            const loc = args.location;
            if (!loc) return;
            const [, r] = loc;
            gs.setHoverRow(r >= 0 ? r : undefined);
            onTooltipHover(args);
          }}
          rowMarkers="both"
          rowSelect="multi"
          rowSelectionMode="multi"
          searchValue={gs.searchValue}
          onSearchValueChange={gs.setSearchValue}
          showSearch={gs.showSearch}
          onSearchClose={() => gs.setShowSearch(false)}
          onHeaderMenuClick={(colIdx: number, bounds: { x: number; y: number; width: number; height: number }) => {
            const column = displayColumns[colIdx] as BaseColumnProps;
            if (column) {
              columnMenu.openMenu(column, bounds.x + bounds.width, bounds.y + bounds.height);
            }
          }}
          ref={dataEditorRef}
          rowHeight={rowHeight}
          headerHeight={headerHeight}
        />
      </div>

      <Tooltip
        content={tooltipData.content}
        x={tooltipData.x}
        y={tooltipData.y}
        visible={tooltipData.visible}
      />

      {/* Column Menu */}
      {columnMenu.menuState.isOpen && columnMenu.menuState.column && (
        <ColumnMenu
          column={columnMenu.menuState.column}
          position={columnMenu.menuState.position}
          onClose={columnMenu.closeMenu}
          onSort={handleSort}
          onPin={handlePin}
          onUnpin={handleUnpin}
          onHide={handleHide}
          onAutosize={handleAutosize}
          onChangeFormat={columnMenu.changeFormat}
          isPinned={columnMenu.getPinnedSide(columnMenu.menuState.column.id)}
          sortDirection={sortState?.columnId === columnMenu.menuState.column.id ? sortState.direction : null}
          isDarkTheme={theme === darkTheme}
        />
      )}
    </div>
  );
}