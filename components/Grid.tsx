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
import { useFullscreen } from "./contexts/FullscreenContext";
import { useGridPersistence } from "./hooks/useGridPersistence";

export default function Grid() {
  // Initialize the data source
  const dataSource = React.useMemo(() => {
    return new InMemoryDataSource(8, 6);
  }, []);
  const gs = useGridState();
  const { theme, setTheme, darkTheme, lightTheme, iconColor } = useGridTheme();
  const [isToolbarHovered, setIsToolbarHovered] = React.useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [gridKey, setGridKey] = React.useState(0); // Force re-render after loading state
  const [isStateLoaded, setIsStateLoaded] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [isDataReady, setIsDataReady] = React.useState(false);
  
  // Reset toolbar hover state when fullscreen changes
  React.useEffect(() => {
    setIsToolbarHovered(false);
  }, [isFullscreen]);

  // Sync legacy grid state with new fullscreen context
  React.useEffect(() => {
    gs.setIsFullscreen(isFullscreen);
  }, [isFullscreen]);

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

  // Get the editing state reference after dataProvider is created
  const editingState = React.useMemo(() => dataProvider.getEditingState(), [dataProvider]);

  // Integrate state persistence using localStorage
  const { saveState, loadState } = useGridPersistence(
    editingState,
    columnsState,
    setColumns,
    gs.hiddenColumns,
    gs.setHiddenColumns,
    isInitializing
  );
  
  // Check if there's persisted state
  const hasPersistedState = React.useMemo(() => {
    return localStorage.getItem("gridState") !== null;
  }, []);

  // Load persisted state on first render
  React.useEffect(() => {
    if (!isStateLoaded && columnsState.length > 0) {
      if (hasPersistedState) {
        // Load persisted state
        loadState();
        // Clear any cached data to ensure fresh load
        dataProvider.refresh().then(() => {
          // Force grid to re-render after loading state
          setGridKey(prev => prev + 1);
          setIsStateLoaded(true);
          setIsDataReady(true);
          // Allow saving after initial load is complete
          setTimeout(() => setIsInitializing(false), 100);
        });
      } else {
        // No persisted state, mark as ready immediately
        setIsStateLoaded(true);
        setIsDataReady(true);
        setIsInitializing(false);
      }
    }
  }, [loadState, dataProvider, isStateLoaded, columnsState.length, hasPersistedState]);

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
    (cell: Item, newVal: any) => {
      baseOnCellEdited(filteredRows)(cell, newVal);
      // Save state after each edit
      saveState();
    },
    [filteredRows, baseOnCellEdited, saveState]
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
  useGridLifecycle(isFullscreen, gs.showColumnMenu, gs.setShowColumnMenu);

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
    saveState();
  }, [gs.selection.rows, filteredRows, dataProvider, clearSelection, saveState]);

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

  // Don't render until data is ready
  if (!isDataReady || columnsState.length === 0) {
    return (
      <FullscreenWrapper theme={theme} darkTheme={darkTheme}>
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          background: theme === darkTheme ? "#111827" : "#f9fafb"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: `3px solid ${theme === darkTheme ? "#374151" : "#e5e7eb"}`,
              borderTopColor: theme === darkTheme ? "#60a5fa" : "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <div style={{
              fontSize: "14px",
              color: theme === darkTheme ? "#9ca3af" : "#6b7280",
              fontFamily: "inherit"
            }}>
              Loading grid...
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </FullscreenWrapper>
    );
  }

    return (
    <FullscreenWrapper 
      theme={theme} 
      darkTheme={darkTheme}
    >
      <div
        style={{
          width: "100%",
          height: isFullscreen ? "100%" : "100%",
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: isFullscreen ? undefined : "center",
          flex: isFullscreen ? 1 : undefined,
          border: isFullscreen 
            ? "none"
            : undefined,
          boxShadow: isFullscreen
            ? "none"
            : undefined,
        }}
      >
        {!isFullscreen && (
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
              saveState();
            }}
            onToggleColumnVisibility={actions.handleToggleColumnVisibility}
            onDownloadCsv={actions.handleDownloadCsv}
            onToggleSearch={() => gs.setShowSearch((v) => !v)}
            onToggleFullscreen={toggleFullscreen}
            onMouseEnter={() => setIsToolbarHovered(true)}
            onMouseLeave={() => setIsToolbarHovered(false)}
          />

          <GridDataEditor
        key={gridKey}
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