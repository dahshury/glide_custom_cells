import React from "react";
import { EditingState } from "../models/EditingState";
import { BaseColumn } from "../hooks/useGridColumns";
import { BaseColumnProps } from "../core/types";

const GRID_STATE_KEY = "gridState";

export function useGridPersistence(
    editingState: React.MutableRefObject<EditingState>,
    columnsState: BaseColumn[],
    setColumns: React.Dispatch<React.SetStateAction<BaseColumn[]>>,
    hiddenColumns: Set<number>,
    setHiddenColumns: React.Dispatch<React.SetStateAction<Set<number>>>
) {
    const saveState = React.useCallback(() => {
        // Convert GridColumn[] to BaseColumnProps[] for EditingState
        const baseColumnProps: BaseColumnProps[] = columnsState.map((col, index) => ({
            id: col.id || `col_${index}`,
            name: col.title || `Column ${index}`,
            title: col.title || `Column ${index}`,
            width: (col as any).width || 100,
            isEditable: (col as any).isEditable || false,
            isHidden: hiddenColumns.has(index),
            isPinned: (col as any).sticky || false,
            isRequired: (col as any).isRequired || false,
            isIndex: false,
            indexNumber: index,
            contentAlignment: "left",
            defaultValue: undefined,
            columnTypeOptions: {},
        }));

        const state = {
            edits: editingState.current.toJson(baseColumnProps),
            columns: columnsState,
            hiddenColumns: Array.from(hiddenColumns),
        };
        localStorage.setItem(GRID_STATE_KEY, JSON.stringify(state));
    }, [editingState, columnsState, hiddenColumns]);

    const loadState = React.useCallback(() => {
        const savedState = localStorage.getItem(GRID_STATE_KEY);
        if (savedState) {
            const state = JSON.parse(savedState);
            editingState.current.fromJson(state.edits, state.columns);
            setColumns(state.columns);
            setHiddenColumns(new Set(state.hiddenColumns));
        }
    }, [editingState, setColumns, setHiddenColumns]);

    // Load state on initial render
    React.useEffect(() => {
        loadState();
    }, [loadState]);

    // We can add a button or a useEffect to trigger saveState
    // For now, we will just return the functions
    return { saveState, loadState };
} 