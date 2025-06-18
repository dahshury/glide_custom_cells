import React from "react";
import { GridColumn, CompactSelection } from "@glideapps/glide-data-grid";
import { ColumnService } from "../services/ColumnService";

interface UseColumnOperationsProps {
  columns: GridColumn[];
  displayColumns: GridColumn[];
  visibleColumnIndices: (number | undefined)[];
  filteredRows: number[];
  getRawCellContent: (col: number, row: number) => any;
  setColumns: React.Dispatch<React.SetStateAction<GridColumn[]>>;
  togglePin: (index: number) => void;
  dataEditorRef?: React.RefObject<any>;
}

export const useColumnOperations = ({
  columns,
  displayColumns,
  visibleColumnIndices,
  filteredRows,
  getRawCellContent,
  setColumns,
  togglePin,
  dataEditorRef,
}: UseColumnOperationsProps) => {
  const columnService = React.useMemo(() => new ColumnService(), []);

  const handleAutosize = React.useCallback(
    (columnId: string) => {
      if (!dataEditorRef?.current) {
        console.warn("DataEditor ref not available for autosize");
        return;
      }

      // Find the column index in displayColumns
      const displayColIndex = displayColumns.findIndex(c => c.id === columnId);
      if (displayColIndex < 0) return;

      // Find the actual column index in the original columns array
      const actualColIndex = visibleColumnIndices[displayColIndex];
      if (actualColIndex === undefined) return;

      // Store the current width
      const currentColumn = columns[actualColIndex];
      const originalWidth = 'width' in currentColumn ? currentColumn.width : 150;

      // First, set the column width to "auto" and disable grow
      setColumns(prev => 
        prev.map((c, idx) => 
          idx === actualColIndex 
            ? { ...c, width: "auto" as any, grow: 0 } 
            : c
        )
      );

      // Use setTimeout to ensure React has rendered with the new width
      setTimeout(() => {
        // Create a CompactSelection with just this column
        const columnSelection = CompactSelection.fromSingleSelection(displayColIndex);
        
        // Call remeasureColumns to let the grid calculate the optimal width
        dataEditorRef.current?.remeasureColumns(columnSelection);

        // After another timeout, capture the measured width and set it as fixed
        setTimeout(() => {
          // Get the bounds of a cell in this column to determine the actual width
          const bounds = dataEditorRef.current?.getBounds(displayColIndex, 0);
          
          if (bounds && bounds.width > 0) {
            // Set the column to the measured width
            setColumns(prev => 
              prev.map((c, idx) => 
                idx === actualColIndex 
                  ? { ...c, width: bounds.width, grow: 0 } 
                  : c
              )
            );
          } else {
            // Fallback: if we couldn't get bounds, restore original width
            setColumns(prev => 
              prev.map((c, idx) => 
                idx === actualColIndex 
                  ? { ...c, width: originalWidth, grow: 0 } 
                  : c
              )
            );
          }
        }, 100);
      }, 0);
    },
    [columns, displayColumns, visibleColumnIndices, setColumns, dataEditorRef]
  );

  const handlePin = React.useCallback(
    (columnId: string, _side: "left" | "right") => {
      const idx = columnService.findColumnIndex(columns, columnId);
      if (idx >= 0) {
        togglePin(idx);
      }
    },
    [columns, togglePin, columnService]
  );

  const handleUnpin = React.useCallback(
    (columnId: string) => {
      const idx = columnService.findColumnIndex(columns, columnId);
      if (idx >= 0) {
        togglePin(idx);
      }
    },
    [columns, togglePin, columnService]
  );

  return {
    handleAutosize,
    handlePin,
    handleUnpin,
  };
}; 