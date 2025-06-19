import React from "react";
import {
  DrawCellCallback,
  GetRowThemeCallback,
  GridCellKind,
  Item,
  CompactSelection,
  GridColumn,
} from "@glideapps/glide-data-grid";

import { GridThemeToggle } from "./ui/GridThemeToggle";
import { GridToolbar } from "./ui/GridToolbar";
import { GridDataEditor } from "./ui/GridDataEditor";
import { ColumnMenu } from "./menus/ColumnMenu";
import Tooltip from "./Tooltip";
import { FullscreenWrapper } from "./ui/FullscreenWrapper";

import { useColumnMenu } from "./hooks/useColumnMenu";
import { useGridTheme } from "./hooks/useGridTheme";
import { useGridColumns } from "./hooks/useGridColumns";
import { useGridState } from "./hooks/useGridState";
import { useGridData } from "./hooks/useGridData";
import { useModularGridData } from "./hooks/useModularGridData";
import { useGridTooltips } from "./hooks/useGridTooltips";
import { useGridActions } from "./hooks/useGridActions";
import { useGridEvents } from "./hooks/useGridEvents";
import { useGridLifecycle } from "./hooks/useGridLifecycle";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useGridDataOperations } from "./hooks/useGridDataOperations";
import { useColumnOperations } from "./hooks/useColumnOperations";
import { InMemoryDataSource } from "./core/data-sources/InMemoryDataSource";

export default function Grid() {
  // Initialize the data source
  const dataSource = React.useMemo(() => {
    return new InMemoryDataSource(8, 6);
  }, []);
  const gs = useGridState();
  const { theme, setTheme, darkTheme, lightTheme, iconColor } = useGridTheme();
  const [isToolbarHovered, setIsToolbarHovered] = React.useState(false);
  
  // Reset toolbar hover state when fullscreen changes
  React.useEffect(() => {
    setIsToolbarHovered(false);
  }, [gs.isFullscreen]);

  // Handle ESC key to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && gs.isFullscreen) {
        gs.setIsFullscreen(false);
      }
    };

    if (gs.isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [gs.isFullscreen, gs]);

  // Add menu animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes menuSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-4px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes submenuSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateX(-4px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

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
  } = useGridColumns(gs.hiddenColumns, dataSource);

  const columnMenu = useColumnMenu();

  // Use the new modular data system
  const {
    getCellContent: baseGetCellContent,
    onCellEdited: baseOnCellEdited,
    getRawCellContent,
    dataProvider,
  } = useModularGridData(
    dataSource,
    visibleColumnIndices,
    theme,
    darkTheme,
    columnMenu.columnFormats
  );



  // Update the grid state to use data source row count
  React.useEffect(() => {
    gs.setNumRows(dataSource.rowCount);
  }, [dataSource.rowCount, gs]);

  const {
    filteredRows,
    filteredRowCount,
    tooltipMatrix,
    sortState,
    handleSort,
  } = useGridDataOperations({
    searchValue: gs.searchValue,
    deletedRows: dataProvider.getDeletedRows(),
    numRows: dataSource.rowCount,
    displayColumns,
    visibleColumnIndices,
    getRawCellContent,
  });

  const dataEditorRef = React.useRef<any>(null);

  const getCellContent = React.useCallback(
    (cell: Item) => {
      const baseCell = baseGetCellContent(filteredRows)(cell);
      const [col] = cell;
      const column = displayColumns[col] as any;

      if (column?.sticky) {
        if (baseCell.kind === GridCellKind.Text && (baseCell as any).style !== "faded") {
          return { ...(baseCell as any), style: "faded" } as any;
        }

        return {
          ...(baseCell as any),
          themeOverride: {
            ...(baseCell as any).themeOverride,
            textDark: theme === darkTheme ? "#a1a1aa" : "#6b7280",
          },
        } as any;
      }

      if (
        baseCell.kind === GridCellKind.Text &&
        ((baseCell as any).style === "faded" || (baseCell as any).themeOverride)
      ) {
        const { style: _s, themeOverride: _t, ...rest } = baseCell as any;
        return { ...rest } as any;
      }

      return baseCell;
    },
    [filteredRows, baseGetCellContent, displayColumns, theme, darkTheme, dataProvider]
  );

  const onCellEdited = React.useCallback(
    (cell: Item, newVal: any) => baseOnCellEdited(filteredRows)(cell, newVal),
    [filteredRows, baseOnCellEdited]
  );

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

  const actions = useGridActions(
    columns,
    gs.setHiddenColumns,
    gs.selection,
    gs.setDeletedRows,
    filteredRows,
    dataSource.rowCount,
    getRawCellContent,
    dataProvider.getDeletedRows(),
    columnsState,
    setColumns,
    gs.hiddenColumns
  );

  const { tooltipData, onTooltipHover } = useGridTooltips(
    tooltipMatrix,
    displayColumns
  );

  useGridEvents(gs.setShowSearch);
  useGridLifecycle(gs.isFullscreen, gs.showColumnMenu, gs.setShowColumnMenu);

  const handleHide = React.useCallback((columnId: string) => {
    const idx = columns.findIndex(c => c.id === columnId);
    if (idx >= 0) gs.setHiddenColumns(prev => new Set([...prev, idx]));
  }, [columns, gs]);

  const clearSelection = React.useCallback(() => {
    gs.setSelection({
      rows: CompactSelection.empty(),
      columns: CompactSelection.empty(),
    });
    gs.setRowSelection(CompactSelection.empty());
  }, [gs]);

  const deleteRows = React.useCallback(async () => {
    const rowsToDelete = new Set<number>();
    gs.selection.rows.toArray().forEach(r => {
      const actualRow = filteredRows[r];
      if (actualRow !== undefined) {
        rowsToDelete.add(actualRow);
      }
    });

    for (const row of rowsToDelete) {
      await dataProvider.deleteRow(row);
    }
    
    clearSelection();
    await dataProvider.refresh();
  }, [gs.selection.rows, filteredRows, dataProvider, clearSelection]);

  const handleItemHovered = React.useCallback((args: any) => {
    const loc = args.location;
    if (!loc) return;
    const [, r] = loc;
    gs.setHoverRow(r >= 0 ? r : undefined);
    onTooltipHover(args);
  }, [gs, onTooltipHover]);

  const handleHeaderMenuClick = React.useCallback((colIdx: number, bounds: { x: number; y: number; width: number; height: number }) => {
    const column = displayColumns[colIdx] as GridColumn;
    if (column) {
      // Position menu so its right edge aligns with the column header's right edge
      const menuWidth = 220; // Same as MENU_WIDTH in ColumnMenu
      columnMenu.openMenu(column as any, bounds.x + bounds.width - menuWidth, bounds.y + bounds.height);
    }
  }, [displayColumns, columnMenu]);

  const { handleAutosize, handlePin, handleUnpin } = useColumnOperations({
    columns,
    displayColumns,
    visibleColumnIndices,
    filteredRows,
    getRawCellContent,
    setColumns,
    togglePin,
    dataEditorRef,
  });

    return (
    <FullscreenWrapper 
      isFullscreen={gs.isFullscreen} 
      theme={theme} 
      darkTheme={darkTheme}
    >
      <div
        style={{
          width: "100%",
          height: gs.isFullscreen ? "100%" : "100%",
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: gs.isFullscreen ? undefined : "center",
          flex: gs.isFullscreen ? 1 : undefined,
          border: gs.isFullscreen 
            ? "none"
            : undefined,
          boxShadow: gs.isFullscreen
            ? "none"
            : undefined,
        }}
      >
        {!gs.isFullscreen && (
          <GridThemeToggle
            currentTheme={theme}
            lightTheme={lightTheme}
            darkTheme={darkTheme}
            iconColor={iconColor}
            filteredRowCount={filteredRowCount}
            onThemeChange={(newTheme) => {
              setTheme(newTheme);
              // Force grid to refetch all cells by toggling search
              const currentSearch = gs.searchValue;
              gs.setSearchValue(currentSearch + " ");
              requestAnimationFrame(() => {
                gs.setSearchValue(currentSearch);
              });
            }}
          />
        )}

              <div style={{ 
          width: "fit-content", 
          maxWidth: "100%", 
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <GridToolbar
            isFullscreen={gs.isFullscreen}
            isFocused={gs.isFocused || isToolbarHovered}
            hasSelection={actions.hasSelection}
            canUndo={canUndo}
            canRedo={canRedo}
            hasHiddenColumns={columns.length > displayColumns.length}
            theme={theme}
            darkTheme={darkTheme}
            iconColor={iconColor}
            onClearSelection={clearSelection}
            onDeleteRows={deleteRows}
            onUndo={undo}
            onRedo={redo}
            onAddRow={async () => {
              await dataProvider.addRow();
              gs.setNumRows(dataSource.rowCount);
              await dataProvider.refresh();
            }}
            onToggleColumnVisibility={actions.handleToggleColumnVisibility}
            onDownloadCsv={actions.handleDownloadCsv}
            onToggleSearch={() => gs.setShowSearch((v) => !v)}
            onToggleFullscreen={() => gs.setIsFullscreen((v) => !v)}
            onMouseEnter={() => setIsToolbarHovered(true)}
            onMouseLeave={() => setIsToolbarHovered(false)}
          />

          <GridDataEditor
        displayColumns={displayColumns}
        filteredRows={filteredRows}
        filteredRowCount={filteredRowCount}
        getCellContent={getCellContent}
        onCellEdited={undoOnCellEdited}
        onGridSelectionChange={onGridSelectionChange}
        gridSelection={gs.selection}
        pinnedColumnsCount={pinnedColumns.length}
        onColumnResize={onColumnResize}
        onRowAppended={() => {
          // Execute async operations but return synchronously
          (async () => {
            await dataProvider.addRow();
            gs.setNumRows(dataSource.rowCount);
            await dataProvider.refresh();
          })();
          // Explicitly return false to prevent auto-edit mode
          return false;
        }}
        onItemHovered={handleItemHovered}
        onHeaderMenuClick={handleHeaderMenuClick}
        searchValue={gs.searchValue}
        onSearchValueChange={gs.setSearchValue}
        showSearch={gs.showSearch}
        onSearchClose={() => {
          gs.setShowSearch(false);
          gs.setSearchValue("");
        }}
        theme={theme}
        darkTheme={darkTheme}
        isFullscreen={gs.isFullscreen}
        hoverRow={gs.hoverRow}
        dataEditorRef={dataEditorRef}
        onMouseEnter={() => gs.setIsFocused(true)}
        onMouseLeave={() => gs.setIsFocused(false)}
              />
        </div>

      </div>

      <Tooltip
        content={tooltipData.content}
        x={tooltipData.x}
        y={tooltipData.y}
        visible={tooltipData.visible}
      />

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
    </FullscreenWrapper>
  );
}