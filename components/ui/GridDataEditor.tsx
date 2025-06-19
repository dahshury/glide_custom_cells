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
  drawTextCell,
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

  const calcHeight = () => {
    const baseHeight = headerHeight + filteredRowCount * rowHeight + rowHeight;
    if (isFullscreen) {
      // In fullscreen, show more rows but cap at a reasonable height
      const maxVisibleRows = 25; // Show up to 25 rows in fullscreen
      const maxHeight = headerHeight + (maxVisibleRows * rowHeight) + rowHeight;
      return Math.min(baseHeight, maxHeight);
    }
    return baseHeight;
  };

  const drawCell: DrawCellCallback = React.useCallback(
    (args, draw) => {
      const { cell, col, ctx, rect } = args;
      const column = displayColumns[col] as any;

      if ((cell as any).isMissingValue) {
        // Save context state
        ctx.save();
        
        // First draw the cell normally to get proper background
        draw();
        
        // Then draw "None" placeholder text with light color on top
        drawTextCell(
          {
            ...args,
            theme: {
              ...(theme as Theme),
              textDark: (theme as Theme).textLight,
            },
          } as any,
          "None",
          cell.contentAlign
        );
        
        // Draw red attention indicator for required fields
        if ((column as any)?.isRequired && (column as any)?.isEditable) {
          drawAttentionIndicator(ctx, rect, theme as Theme);
        }
        
        // Restore context state
        ctx.restore();
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

      // Ensure each row has its own clean theme
      return {
        bgCell: (theme as any).bgCell,
        bgCellMedium: (theme as any).bgCellMedium,
        textDark: (theme as any).textDark,
        textLight: (theme as any).textLight,
      };
    },
    [hoverRow, theme, filteredRowCount]
  );

  const containerStyle: React.CSSProperties = {
    width: "fit-content",
    maxWidth: "100%",
    height: isFullscreen ? "100%" : "auto",
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    flex: isFullscreen ? undefined : undefined,
    display: "inline-block",
    padding: isFullscreen ? "16px" : undefined,
    margin: "0 auto",
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
        width={displayColumns.reduce((sum, col) => sum + ((col as any).width || 150), 60)}
        height={calcHeight()}
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
        trailingRowOptions={{
          sticky: true,
        }}
      />
    </div>
  );
}; 