import React from "react";
import { GridColumn, GridColumnIcon } from "@glideapps/glide-data-grid";
import { IDataSource, IColumnDefinition } from "../core/interfaces/IDataSource";

export function useGridColumns(hiddenColumns: Set<number>, dataSource?: IDataSource) {
  const [pinnedColumns, setPinnedColumns] = React.useState<number[]>([]);
  const [columnsState, setColumnsState] = React.useState<GridColumn[]>([]);
  
  React.useEffect(() => {
    if (!dataSource) {
      // Fallback to legacy column definitions
      const defaultColumns: GridColumn[] = [
        { id: "name", title: "Full Name", width: 150, icon: GridColumnIcon.HeaderString, isRequired: true, isEditable: true, hasMenu: true, dataType: "text" } as any,
        { id: "status", title: "Status", width: 120, icon: GridColumnIcon.HeaderArray, isRequired: true, isEditable: true, hasMenu: true, dataType: "dropdown" } as any,
        { id: "amount", title: "Amount", width: 100, icon: GridColumnIcon.HeaderNumber, themeOverride: { textDark: "#00c896" }, isRequired: true, isEditable: true, hasMenu: true, dataType: "number" } as any,
        { id: "date", title: "Date", width: 100, icon: GridColumnIcon.HeaderDate, isEditable: true, hasMenu: true, dataType: "date" } as any,
        { id: "time", title: "Time", width: 100, icon: GridColumnIcon.HeaderTime, isEditable: true, hasMenu: true, dataType: "time" } as any,
        { id: "phone", title: "Phone", width: 105, icon: GridColumnIcon.HeaderPhone, isEditable: true, hasMenu: true, dataType: "phone" } as any,
      ];
      setColumnsState(defaultColumns);
    } else {
      const columnDefs = dataSource.getColumnDefinitions();
      const gridColumns: GridColumn[] = columnDefs.map((def, index) => ({
        id: def.id,
        title: def.title,
        width: def.width || 120,
        icon: getColumnIcon(def),
        themeOverride: getColumnThemeOverride(def),
        isRequired: def.isRequired || false,
        isEditable: def.isEditable !== false,
        hasMenu: true,
        dataType: def.dataType,
      } as any));
      setColumnsState(gridColumns);
      
      const pinnedIndices = columnDefs
        .map((def, idx) => def.isPinned ? idx : -1)
        .filter(idx => idx >= 0);
      setPinnedColumns(pinnedIndices);
    }
  }, [dataSource]);

  const visibleColumns = React.useMemo(() => {
    return columnsState.filter((_, idx) => !hiddenColumns.has(idx));
  }, [columnsState, hiddenColumns]);

  const visibleColumnIndices = React.useMemo(() => {
    return visibleColumns.map(col => {
      const idx = columnsState.findIndex(c => c.id === col.id);
      return idx >= 0 ? idx : undefined;
    }).filter((idx): idx is number => idx !== undefined);
  }, [visibleColumns, columnsState]);

  const displayColumns = React.useMemo(() => {
    const pinnedCols = pinnedColumns.map(idx => ({ 
      ...columnsState[idx], 
      sticky: true,
      hasMenu: true 
    }));
    const unpinnedCols = visibleColumns.filter((_, idx) => !pinnedColumns.includes(visibleColumnIndices[idx]));
    return [...pinnedCols.filter(c => visibleColumns.includes(c)), ...unpinnedCols].map(col => ({
      ...col,
      hasMenu: col.hasMenu !== false,
      dataType: (col as any).dataType  // Ensure dataType is preserved
    }));
  }, [visibleColumns, pinnedColumns, columnsState, visibleColumnIndices]);

  const onColumnResize = React.useCallback((column: GridColumn, newSize: number) => {
    setColumnsState((prev) =>
      prev.map(c => c.id === column.id ? { ...c, width: newSize } : c)
    );
  }, []);

  const onColumnMoved = React.useCallback((startIndex: number, endIndex: number) => {
    setColumnsState((prev) => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const togglePin = React.useCallback((columnIndex: number) => {
    setPinnedColumns((prev) => {
      if (prev.includes(columnIndex)) {
        return prev.filter(idx => idx !== columnIndex);
      } else {
        return [...prev, columnIndex];
      }
    });
  }, []);

  const setColumns = setColumnsState;

  return {
    columns: columnsState,
    columnsState,
    displayColumns,
    visibleColumnIndices,
    onColumnResize,
    setColumns,
    onColumnMoved,
    togglePin,
    pinnedColumns,
  };
}

function getColumnThemeOverride(column: IColumnDefinition): any {
  const overrides: any = {};
  
  // Add specific theme overrides based on column type or metadata
  if (column.dataType === "number" && column.formatting?.type === "currency") {
    overrides.textDark = "#00c896";
  }
  
  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

function getColumnIcon(column: IColumnDefinition): GridColumnIcon {
  switch (column.dataType) {
    case "text":
      return GridColumnIcon.HeaderString;
    case "number":
      return GridColumnIcon.HeaderNumber;
    case "date":
      return GridColumnIcon.HeaderDate;
    case "time":
      return GridColumnIcon.HeaderTime;
    case "dropdown":
      return GridColumnIcon.HeaderArray;
    case "phone":
      return GridColumnIcon.HeaderPhone;
    case "boolean":
      return GridColumnIcon.HeaderBoolean;
    default:
      return GridColumnIcon.HeaderString;
  }
} 