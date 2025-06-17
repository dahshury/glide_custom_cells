import React, { useState, useCallback } from "react";
import { DataEditorProps, GridCell, GridMouseEventArgs } from "@glideapps/glide-data-grid";
import { GridColumn } from "@glideapps/glide-data-grid";

export const TOOLTIP_DEBOUNCE_MS = 600;

export interface TooltipState {
  content: string;
  left: number;
  top: number;
}

export interface TooltipsReturn {
  tooltip: TooltipState | undefined;
  clearTooltip: () => void;
  onItemHovered: DataEditorProps["onItemHovered"];
}

/**
 * Returns true if the given cell has a tooltip available (custom property `tooltip`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasTooltip(cell: any): cell is { tooltip: string } {
  return cell && typeof cell === "object" && typeof cell.tooltip === "string";
}

/**
 * Returns true if the given cell contains no value (-> missing value).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMissingValueCell(cell: any): boolean {
  return cell && typeof cell === "object" && cell.isMissingValue === true;
}

/**
 * Returns true if the given cell contains an error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isErrorCell(cell: any): boolean {
  return cell && typeof cell === "object" && cell.isError === true;
}

interface TooltipData {
  content: string;
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Hook to manage hover tooltips for DataEditor cells and headers.
 */
export function useGridTooltips(data: any[][], columns: any[]) {
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    content: '',
    x: 0,
    y: 0,
    visible: false,
  });

  const onTooltipHover = useCallback((args: GridMouseEventArgs) => {
    const { location } = args;
    
    if (!location || location[0] < 0 || location[1] < 0) {
      setTooltipData(prev => ({ ...prev, visible: false }));
      return;
    }

    const [col, row] = location;
    
    // Use the bounds from args to get global coordinates
    const bounds = (args as any).bounds;
    if (!bounds) {
      // Pointer is not over a grid cell – hide any tooltip
      setTooltipData(prev => ({ ...prev, visible: false }));
      return;
    }
    const globalX = bounds.x + bounds.width / 2;
    const globalY = bounds.y;

    // Header tooltips
    if (row === -1 && col >= 0 && col < columns.length) {
      const column = columns[col];
      if (column.help) {
        setTooltipData({
          content: column.help,
          x: globalX,
          y: globalY,
          visible: true,
        });
        return;
      }
    }

    // Cell tooltips
    if (row >= 0 && row < data.length && col >= 0 && col < columns.length) {
      const column = columns[col];
      const cellValue = data[row][col];
      
      // Show tooltip for missing required cells
      if (column.isRequired && (cellValue === '' || cellValue === null || cellValue === undefined)) {
        setTooltipData({
          content: `${column.title} is required`,
          x: globalX,
          y: globalY,
          visible: true,
        });
        return;
      }
    }

    // Add row tooltip – only when hovering the trailing row within grid columns
    const addRowIndex = data.length;
    if (row === addRowIndex && col >= 0 && col < columns.length) {
      setTooltipData({
        content: 'Click to add a new row',
        x: globalX,
        y: globalY,
        visible: true,
      });
      return;
    }

    // Hide tooltip if no conditions met
    setTooltipData(prev => ({ ...prev, visible: false }));
  }, [data, columns]);

  return { tooltipData, onTooltipHover };
} 