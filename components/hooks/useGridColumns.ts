import React from "react";
import { GridColumn, GridColumnIcon } from "@glideapps/glide-data-grid";

export type { GridColumn as BaseColumn };

export function useGridColumns(hiddenColumns: Set<number>) {
    // Track which columns have been manually resized
    const hasResized = React.useRef(new Set<number>());

    // Define pinned columns state
    const [pinnedColumns, setPinnedColumns] = React.useState<number[]>([]);

    // Columns including a number column for formatting
    const columns: GridColumn[] = React.useMemo(
        () => [
            { title: "Name", width: 200, id: "text", icon: GridColumnIcon.HeaderString, isRequired: true, isEditable: true, hasMenu: true },
            { title: "Dropdown", width: 180, id: "dropdown", icon: GridColumnIcon.HeaderArray, isEditable: true, hasMenu: true },
            { title: "Amount", width: 120, id: "number", icon: GridColumnIcon.HeaderNumber, isEditable: true, hasMenu: true },
            { title: "Date", width: 160, id: "date", icon: GridColumnIcon.HeaderDate, isEditable: true, hasMenu: true },
            { title: "Time", width: 140, id: "time", icon: GridColumnIcon.HeaderTime, isEditable: true, hasMenu: true },
            { title: "Phone", width: 126, id: "phone", icon: GridColumnIcon.HeaderPhone, isEditable: true, hasMenu: true },
        ].map((col, i) => ({
            ...col,
            // Add grow property - columns grow proportionally until manually resized
            grow: hasResized.current.has(i) ? undefined : (5 + i) / 5,
        })),
        [hasResized.current.size] // Re-compute when resize tracking changes
    );

    const [columnsState, setColumns] = React.useState(columns);

    // Visible columns array for grid (pinned columns first)
    const visibleColumnIndices = React.useMemo(() => {
        const allVisible: number[] = [];
        columnsState.forEach((_, idx) => {
            if (!hiddenColumns.has(idx)) allVisible.push(idx);
        });

        // Ensure pinned columns keep their relative order as in `pinnedColumns`
        const ordered = [
            ...pinnedColumns.filter(idx => allVisible.includes(idx)),
            ...allVisible.filter(idx => !pinnedColumns.includes(idx)),
        ];

        return ordered;
    }, [columnsState, hiddenColumns, pinnedColumns]);

    const displayColumns = React.useMemo(() => {
        const regularCols = visibleColumnIndices.map(idx => columnsState[idx]);
        const pinned = pinnedColumns.map(idx => ({ ...columnsState[idx], sticky: true }));
        return [...pinned, ...regularCols.filter(c => !pinned.some(p => p.id === c.id))];
    }, [columnsState, visibleColumnIndices, pinnedColumns]);

    // Handle column resize with grow tracking
    const onColumnResize = React.useCallback(
        (column: GridColumn, newSize: number, colIndex: number, newSizeWithGrow: number) => {
            // Use newSizeWithGrow which accounts for grow calculations
            const width = Math.max(20, Math.min(newSizeWithGrow, 1000));

            hasResized.current.add(colIndex);

            const actualIndex = visibleColumnIndices[colIndex] ?? colIndex;
            setColumns(prev =>
                prev.map((c, idx) => (idx === actualIndex ? { 
                    ...c, 
                    width, 
                    grow: 0 // Disable grow when manually resized
                } : c))
            );
        },
        [setColumns, visibleColumnIndices]
    );

    const onColumnMoved = React.useCallback((startIndex: number, endIndex: number) => {
        setColumns(prev => {
            const newCols = [...prev];
            const [moved] = newCols.splice(startIndex, 1);
            newCols.splice(endIndex, 0, moved);
            return newCols;
        });
    }, []);

    const togglePin = React.useCallback((colIndex: number) => {
        setPinnedColumns(prev => {
            if (prev.includes(colIndex)) {
                return prev.filter(i => i !== colIndex);
            } else {
                return [...prev, colIndex];
            }
        });
    }, []);

    return {
        columns,
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