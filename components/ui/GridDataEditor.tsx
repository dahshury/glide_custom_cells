import React from "react";
import DataEditor, {
  DrawCellCallback,
  GetRowThemeCallback,
  GridCellKind,
  Item,
  CompactSelection,
  GridColumn,
  Theme,
  GridSelection,
  CustomRenderer,
} from "@glideapps/glide-data-grid";
import { DropdownCell as DropdownRenderer } from "@glideapps/glide-data-grid-cells";
import TempusDateCellRenderer from "../TempusDominusDateCell";
import PhoneInputCellRenderer from "../PhoneInputCell";
import { drawAttentionIndicator } from "../utils/cellDrawHelpers";

const customRenderers = [
  DropdownRenderer,
  TempusDateCellRenderer,
  PhoneInputCellRenderer,
];

interface GridDataEditorProps {
  displayColumns: GridColumn[];
  filteredRows: number[];
  filteredRowCount: number;
  getCellContent: (cell: Item) => any;
  onCellEdited: (cell: Item, newVal: any) => void;
  onGridSelectionChange: (selection: GridSelection) => void;
  gridSelection: GridSelection;
  pinnedColumnsCount: number;
  onColumnResize: (column: GridColumn, newSize: number) => void;
  onRowAppended: () => void;
  onItemHovered: (args: any) => void;
  onHeaderMenuClick: (colIdx: number, bounds: { x: number; y: number; width: number; height: number }) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  showSearch: boolean;
  onSearchClose: () => void;
  theme: Partial<Theme>;
  darkTheme: Partial<Theme>;
  isFullscreen: boolean;
  hoverRow?: number;
  dataEditorRef: React.RefObject<any>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const GridDataEditor: React.FC<GridDataEditorProps> = ({
  displayColumns,
  filteredRows,
  filteredRowCount,
  getCellContent,
  onCellEdited,
  onGridSelectionChange,
  gridSelection,
  pinnedColumnsCount,
  onColumnResize,
  onRowAppended,
  onItemHovered,
  onHeaderMenuClick,
  searchValue,
  onSearchValueChange,
  showSearch,
  onSearchClose,
  theme,
  darkTheme,
  isFullscreen,
  hoverRow,
  dataEditorRef,
  onMouseEnter,
  onMouseLeave,
}) => {
  const rowHeight = 33;
  const headerHeight = 35;

  const calcHeight = () => headerHeight + filteredRowCount * rowHeight + rowHeight;

  const drawCell: DrawCellCallback = React.useCallback(
    (args, draw) => {
      const { cell, col } = args;
      const column = displayColumns[col] as any;

      if ((cell as any).isMissingValue) {
        if ((column as any)?.isRequired && (column as any)?.isEditable) {
          const { ctx, rect } = args;
          drawAttentionIndicator(ctx, rect, theme as Theme);
        }
        return;
      }
      draw();
    },
    [displayColumns, theme]
  );

  const getRowThemeOverride: GetRowThemeCallback = React.useCallback(
    row => {
      if (row === hoverRow) {
        return { 
          bgCell: (theme as any).bgCellMedium, 
          bgCellMedium: (theme as any).bgCellMedium 
        };
      }

      if (row === filteredRowCount) {
        return {
          bgCell: (theme as any).bgHeader ?? (theme as any).bgCell,
          bgCellMedium: (theme as any).bgHeader ?? (theme as any).bgCellMedium,
          textDark: (theme as any).textHeader,
        } as any;
      }

      return undefined;
    },
    [hoverRow, theme, filteredRowCount]
  );

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: isFullscreen ? "100vh" : "auto",
    position: isFullscreen ? "fixed" : "relative",
    top: isFullscreen ? 0 : "auto",
    left: isFullscreen ? 0 : "auto",
    right: isFullscreen ? 0 : "auto",
    bottom: isFullscreen ? 0 : "auto",
    zIndex: isFullscreen ? 999 : undefined,
    backgroundColor: isFullscreen
      ? theme === darkTheme
        ? "#1e1e1e"
        : "#ffffff"
      : "transparent",
    padding: isFullscreen ? "60px 20px 20px 20px" : 0,
    borderRadius: "12px",
    overflow: "hidden",
  };

  return (
    <div 
      style={containerStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <DataEditor
        getCellContent={getCellContent}
        columns={displayColumns}
        rows={filteredRowCount}
        width="100%"
        height={isFullscreen ? "calc(100vh - 80px)" : calcHeight()}
        maxColumnAutoWidth={400}
        maxColumnWidth={2000}
        minColumnWidth={50}
        scaleToRem
        theme={theme as Theme}
        experimental={{
          disableMinimumCellWidth: true,
        }}
        customRenderers={customRenderers}
        drawCell={drawCell}
        getRowThemeOverride={getRowThemeOverride}
        gridSelection={gridSelection}  
        onGridSelectionChange={onGridSelectionChange}
        freezeColumns={pinnedColumnsCount}
        onRowAppended={onRowAppended}
        onColumnResize={onColumnResize}
        onCellEdited={onCellEdited}
        onItemHovered={onItemHovered}
        rowMarkers="both"
        rowSelect="multi"
        rowSelectionMode="multi"
        columnSelect="none"
        searchValue={searchValue}
        onSearchValueChange={onSearchValueChange}
        showSearch={showSearch}
        onSearchClose={onSearchClose}
        onHeaderMenuClick={onHeaderMenuClick}
        ref={dataEditorRef}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        getCellsForSelection={true}
        fillHandle={true}
      />
    </div>
  );
}; 