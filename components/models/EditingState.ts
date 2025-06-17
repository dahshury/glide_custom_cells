import { GridCell, GridCellKind } from "@glideapps/glide-data-grid";
import { BaseColumnProps } from "../core/types";
import { isNullOrUndefined, notNullOrUndefined } from "../utils/generalUtils";

const INDEX_IDENTIFIER = "_index";

export function getColumnName(column: BaseColumnProps): string {
  return column.isIndex
    ? INDEX_IDENTIFIER
    : isNullOrUndefined(column.name)
      ? ""
      : column.name;
}

export function isMissingValueCell(cell: GridCell): boolean {
  const cellData = (cell as any).data;
  const displayData = (cell as any).displayData;
  
  return (
    isNullOrUndefined(cellData) ||
    cellData === "" ||
    (isNullOrUndefined(displayData) || displayData === "")
  );
}

export class EditingState {
  private editedCells: Map<number, Map<number, GridCell>> = new Map();
  private addedRows: Array<Map<number, GridCell>> = [];
  private deletedRows: number[] = [];
  private numRows: number;

  constructor(numRows: number) {
    this.numRows = numRows;
  }

  toJson(columns: BaseColumnProps[]): string {
    const columnsByIndex = new Map<number, BaseColumnProps>();
    columns.forEach(column => {
      columnsByIndex.set(column.indexNumber, column);
    });

    const currentState = {
      edited_rows: {} as Record<number, Record<string, any>>,
      added_rows: [] as Record<string, any>[],
      deleted_rows: [] as number[],
    };

    this.editedCells.forEach((row: Map<number, GridCell>, rowIndex: number) => {
      const editedRow: Record<string, any> = {};
      row.forEach((cell: GridCell, colIndex: number) => {
        const column = columnsByIndex.get(colIndex);
        if (column) {
          editedRow[getColumnName(column)] = this.getCellValue(cell, column);
        }
      });
      currentState.edited_rows[rowIndex] = editedRow;
    });

    this.addedRows.forEach((row: Map<number, GridCell>) => {
      const addedRow: Record<string, any> = {};
      let isIncomplete = false;
      
      row.forEach((cell: GridCell, colIndex: number) => {
        const column = columnsByIndex.get(colIndex);
        if (column) {
          const cellValue = this.getCellValue(cell, column);

          if (
            column.isRequired &&
            column.isEditable &&
            isMissingValueCell(cell)
          ) {
            isIncomplete = true;
          }

          if (notNullOrUndefined(cellValue)) {
            addedRow[getColumnName(column)] = cellValue;
          }
        }
      });
      
      if (!isIncomplete) {
        currentState.added_rows.push(addedRow);
      }
    });

    currentState.deleted_rows = this.deletedRows;

    return JSON.stringify(currentState, (_k, v) =>
      v === undefined ? null : v
    );
  }

  fromJson(editingStateJson: string, columns: BaseColumnProps[]): void {
    this.editedCells = new Map();
    this.addedRows = [];
    this.deletedRows = [];

    const editingState = JSON.parse(editingStateJson);
    
    const columnsByIndex = new Map<number, BaseColumnProps>();
    columns.forEach(column => {
      columnsByIndex.set(column.indexNumber, column);
    });

    const columnsByName = new Map<string, BaseColumnProps>();
    columns.forEach(column => {
      columnsByName.set(getColumnName(column), column);
    });

    Object.keys(editingState.edited_rows || {}).forEach(key => {
      const rowIndex = Number(key);
      const editedRow = editingState.edited_rows[key];
      Object.keys(editedRow).forEach((colName: string) => {
        const cellValue = editedRow[colName];
        const column = columnsByName.get(colName);
        if (column) {
          const cell = this.createCell(cellValue, column);
          if (cell) {
            if (!this.editedCells.has(rowIndex)) {
              this.editedCells.set(rowIndex, new Map());
            }
            this.editedCells.get(rowIndex)?.set(column.indexNumber, cell);
          }
        }
      });
    });

    (editingState.added_rows || []).forEach((row: Record<string, any>) => {
      const addedRow: Map<number, GridCell> = new Map();
      
      columns.forEach(column => {
        const cell = this.createCell(null, column);
        if (cell) {
          addedRow.set(column.indexNumber, cell);
        }
      });

      Object.keys(row).forEach(colName => {
        const column = columnsByName.get(colName);
        if (column) {
          const cell = this.createCell(row[colName], column);
          if (cell) {
            addedRow.set(column.indexNumber, cell);
          }
        }
      });
      
      this.addedRows.push(addedRow);
    });

    this.deletedRows = editingState.deleted_rows || [];
  }

  isAddedRow(row: number): boolean {
    return row >= this.numRows;
  }

  getCell(col: number, row: number): GridCell | undefined {
    if (this.isAddedRow(row)) {
      const addedRowIndex = row - this.numRows;
      return this.addedRows[addedRowIndex]?.get(col);
    }
    return this.editedCells.get(row)?.get(col);
  }

  setCell(col: number, row: number, cell: GridCell): void {
    if (this.isAddedRow(row)) {
      const addedRowIndex = row - this.numRows;
      if (!this.addedRows[addedRowIndex]) {
        this.addedRows[addedRowIndex] = new Map();
      }
      this.addedRows[addedRowIndex].set(col, cell);
    } else {
      if (!this.editedCells.has(row)) {
        this.editedCells.set(row, new Map());
      }
      this.editedCells.get(row)!.set(col, cell);
    }
  }

  addRow(rowCells: Map<number, GridCell>): void {
    this.addedRows.push(rowCells);
  }

  deleteRows(rows: number[]): void {
    rows.forEach(row => this.deleteRow(row));
  }

  deleteRow(row: number): void {
    if (this.isAddedRow(row)) {
      const addedRowIndex = row - this.numRows;
      this.addedRows.splice(addedRowIndex, 1);
    } else {
      if (!this.deletedRows.includes(row)) {
        this.deletedRows.push(row);
      }
    }
  }

  getOriginalRowIndex(row: number): number {
    if (this.isAddedRow(row)) {
      return -1;
    }
    
    let deletedBeforeRow = 0;
    for (const deletedRow of this.deletedRows) {
      if (deletedRow < row) {
        deletedBeforeRow++;
      }
    }
    
    return row + deletedBeforeRow;
  }

  getNumRows(): number {
    return this.numRows + this.addedRows.length - this.deletedRows.length;
  }

  clearMemory(): void {
    this.editedCells.clear();
    this.addedRows = [];
    this.deletedRows = [];
  }

  getMemoryUsage(): { editedCells: number; addedRows: number; deletedRows: number } {
    return {
      editedCells: this.editedCells.size,
      addedRows: this.addedRows.length,
      deletedRows: this.deletedRows.length,
    };
  }

  private getCellValue(cell: GridCell, column: BaseColumnProps): any {
    if (cell.kind === GridCellKind.Text) {
      return (cell as any).data;
    }
    if (cell.kind === GridCellKind.Number) {
      return (cell as any).data;
    }
    if (cell.kind === GridCellKind.Boolean) {
      return (cell as any).data;
    }
    if (cell.kind === GridCellKind.Custom) {
      const customCell = cell as any;
      if (customCell.data?.kind === "dropdown-cell") {
        return customCell.data.value;
      }
      if (customCell.data?.kind === "tempus-date-cell") {
        return customCell.data.date;
      }
      if (customCell.data?.kind === "phone-input-cell") {
        return customCell.data.phone;
      }
      return customCell.data;
    }
    return (cell as any).data;
  }

  private createCell(value: any, column: BaseColumnProps): GridCell | null {
    if (column.id === "text" || column.name.toLowerCase().includes("text")) {
      return {
        kind: GridCellKind.Text,
        data: value || "",
        displayData: value || "",
        allowOverlay: true,
      };
    }
    
    if (column.id === "number" || column.name.toLowerCase().includes("number")) {
      const numValue = value !== null && value !== undefined ? Number(value) : 0;
      return {
        kind: GridCellKind.Number,
        data: numValue,
        displayData: numValue.toString(),
        allowOverlay: true,
      };
    }
    
    if (column.id === "boolean" || column.name.toLowerCase().includes("boolean")) {
      return {
        kind: GridCellKind.Boolean,
        data: Boolean(value),
        allowOverlay: false,
      };
    }

    return {
      kind: GridCellKind.Text,
      data: value || "",
      displayData: value?.toString() || "",
      allowOverlay: true,
    };
  }
} 