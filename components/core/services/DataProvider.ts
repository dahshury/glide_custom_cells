import { GridCell, GridCellKind, Theme } from "@glideapps/glide-data-grid";
import { IDataSource, IColumnDefinition } from "../interfaces/IDataSource";
import { IDataProvider } from "../interfaces/IDataSource";
import { ColumnTypeRegistry } from "./ColumnTypeRegistry";
import { EditingState } from "../../models/EditingState";

export class DataProvider implements IDataProvider {
  private dataSource: IDataSource;
  private columnDefinitions: IColumnDefinition[];
  private editingState: EditingState;
  private theme: Partial<Theme>;
  private isDarkTheme: boolean;
  private columnTypeRegistry: ColumnTypeRegistry;
  private cellCache: Map<string, GridCell> = new Map();
  private columnFormats: Record<string, string> = {};

  constructor(
    dataSource: IDataSource,
    theme: Partial<Theme>,
    isDarkTheme: boolean
  ) {
    this.dataSource = dataSource;
    this.theme = theme;
    this.isDarkTheme = isDarkTheme;
    this.columnDefinitions = dataSource.getColumnDefinitions();
    this.editingState = new EditingState(dataSource.rowCount);
    this.columnTypeRegistry = ColumnTypeRegistry.getInstance();
  }

  public getCell(col: number, row: number): GridCell {
    const cacheKey = `${col}-${row}`;
    
    const storedCell = this.editingState.getCell(col, row);
    if (storedCell) {
      // Return a copy to prevent mutation
      return { ...storedCell };
    }

    const cachedCell = this.cellCache.get(cacheKey);
    if (cachedCell) {
      // Return a copy to prevent mutation
      return { ...cachedCell };
    }

    const column = this.columnDefinitions[col];
    if (!column) {
      return this.createEmptyCell();
    }

    // Apply user-selected formatting if available
    const formattedColumn = this.applyColumnFormat(column);

    const columnType = this.columnTypeRegistry.get(column.dataType);
    if (!columnType) {
      console.warn(`No column type registered for ${column.dataType}`);
      return this.createEmptyCell();
    }

    this.dataSource.getCellData(col, row).then(value => {
      const cell = columnType.createCell(value, formattedColumn, this.theme, this.isDarkTheme);
      this.cellCache.set(cacheKey, cell);
    }).catch(error => {
      console.error(`Failed to load cell data for ${col},${row}:`, error);
    });

    const defaultValue = columnType.getDefaultValue(formattedColumn);
    const cell = columnType.createCell(defaultValue, formattedColumn, this.theme, this.isDarkTheme);
    this.cellCache.set(cacheKey, cell);
    
    return { ...cell };
  }

  public setCell(col: number, row: number, value: GridCell): void {
    const column = this.columnDefinitions[col];
    if (!column || !column.isEditable) {
      return;
    }

    // Apply user-selected formatting if available
    const formattedColumn = this.applyColumnFormat(column);

    const columnType = this.columnTypeRegistry.get(column.dataType);
    if (!columnType) {
      return;
    }

    const cellValue = columnType.getCellValue(value);
    const validation = columnType.validateValue(cellValue, column);
    
    // Create updated cell with validation state
    const updatedCell = columnType.createCell(cellValue, formattedColumn, this.theme, this.isDarkTheme);
    this.editingState.setCell(col, row, updatedCell);
    
    if (validation.isValid) {
      this.dataSource.setCellData(col, row, cellValue).catch(error => {
        console.error(`Failed to save cell data for ${col},${row}:`, error);
      });
    } else {
      // Clear the cache so the cell gets re-rendered with validation state
      const cacheKey = `${col}-${row}`;
      this.cellCache.delete(cacheKey);
    }
  }

  public getColumnDefinition(col: number): IColumnDefinition {
    return this.columnDefinitions[col];
  }

  public getRowCount(): number {
    return this.dataSource.rowCount;
  }

  public getColumnCount(): number {
    return this.dataSource.columnCount;
  }

  public async refresh(): Promise<void> {
    this.cellCache.clear();
    this.columnDefinitions = this.dataSource.getColumnDefinitions();
    await this.dataSource.refresh();
  }

  public updateTheme(theme: Partial<Theme>, isDarkTheme: boolean): void {
    this.theme = theme;
    this.isDarkTheme = isDarkTheme;
    this.cellCache.clear();
  }

  public setColumnFormats(formats: Record<string, string>): void {
    this.columnFormats = formats;
    this.cellCache.clear();
  }

  public async addRow(): Promise<number> {
    const newRowIndex = await this.dataSource.addRow();
    // Ensure editingState is aware of new row count without losing existing edits
    // We add an empty row entry to maintain consistency
    const rowCells = new Map<number, GridCell>();
    this.columnDefinitions.forEach((col, idx) => {
      const columnType = this.columnTypeRegistry.get(col.dataType);
      if (columnType) {
        const cell = columnType.createCell(null, col, this.theme, this.isDarkTheme);
        rowCells.set(idx, cell);
      }
    });
    this.editingState.addRow(rowCells);
    return newRowIndex;
  }

  public async deleteRow(row: number): Promise<boolean> {
    const success = await this.dataSource.deleteRow(row);
    if (success) {
      this.editingState.deleteRow(row);
    }
    return success;
  }

  public getDeletedRows(): Set<number> {
    const combined = new Set<number>([...this.dataSource.getDeletedRows(), ...this.editingState.getDeletedRows()]);
    return combined;
  }

  private createEmptyCell(): GridCell {
    return {
      kind: GridCellKind.Text,
      data: "",
      displayData: "",
      allowOverlay: false
    };
  }

  private applyColumnFormat(column: IColumnDefinition): IColumnDefinition {
    const format = this.columnFormats[column.id];
    if (!format) {
      return column;
    }

    // Create a new column definition with the selected format
    return {
      ...column,
      formatting: {
        ...column.formatting,
        type: format
      }
    };
  }

  public getEditingState(): EditingState {
    return this.editingState;
  }
} 