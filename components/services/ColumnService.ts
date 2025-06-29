import { GridCellKind, GridColumn } from "@glideapps/glide-data-grid";

export class ColumnService {
  private readonly MIN_COLUMN_WIDTH = 50;
  private readonly MAX_COLUMN_WIDTH = 400;
  private readonly HEADER_PADDING = 16;
  private readonly CELL_PADDING = 8;
  private readonly MAX_SAMPLE_SIZE = 100;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  private getCanvasContext(): CanvasRenderingContext2D | null {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d");
    }
    return this.context;
  }

  private measureTextWidth(text: string, font: string = "13px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"): number {
    const ctx = this.getCanvasContext();
    if (!ctx) {
      return text.length * 7;
    }
    
    ctx.font = font;
    const metrics = ctx.measureText(text);
    return Math.ceil(metrics.width);
  }

  private extractDisplayText(cell: any): string {
    if (cell.kind === GridCellKind.Text) {
      return cell.displayData || cell.data || "";
    }
    
    if (cell.kind === GridCellKind.Number) {
      return String(cell.data || "");
    }
    
    if (cell.kind === GridCellKind.Custom) {
      const customData = cell.data;
      if (customData?.kind === "dropdown-cell") {
        return customData.value || "";
      }
      if (customData?.kind === "tempus-date-cell") {
        return customData.date ? customData.date.toLocaleDateString('en-GB') : "";
      }
      if (customData?.kind === "phone-input-cell") {
        return customData.phone || "";
      }
      return cell.displayData || cell.data || "";
    }
    
    return "";
  }

  public calculateAutoSize(
    columnId: string,
    displayColumns: GridColumn[],
    visibleColumnIndices: (number | undefined)[],
    filteredRows: number[],
    getRawCellContent: (col: number, row: number) => any
  ): number {
    const colIdx = displayColumns.findIndex(c => c.id === columnId);
    if (colIdx < 0) return this.MIN_COLUMN_WIDTH;

    const actualColIndex = visibleColumnIndices[colIdx];
    if (actualColIndex === undefined) return this.MIN_COLUMN_WIDTH;

    // Measure header width with bold font (600 weight)
    const headerWidth = this.measureTextWidth(
      displayColumns[colIdx].title, 
      "600 13px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    ) + this.HEADER_PADDING;

    // Measure cell content widths
    let maxCellWidth = 0;
    const sampleSize = Math.min(filteredRows.length, this.MAX_SAMPLE_SIZE);
    
    for (let i = 0; i < sampleSize; i++) {
      const row = filteredRows[i];
      const cell = getRawCellContent(actualColIndex, row);
      const text = this.extractDisplayText(cell);
      
      if (text) {
        const cellWidth = this.measureTextWidth(text, "13px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
        maxCellWidth = Math.max(maxCellWidth, cellWidth);
      }
    }

    const contentWidth = maxCellWidth + this.CELL_PADDING;
    const finalWidth = Math.max(headerWidth, contentWidth);

    return Math.max(
      this.MIN_COLUMN_WIDTH,
      Math.min(finalWidth, this.MAX_COLUMN_WIDTH)
    );
  }

  public updateColumnWidth(
    columns: GridColumn[],
    columnIndex: number,
    newWidth: number
  ): GridColumn[] {
    return columns.map((c, idx) =>
      idx === columnIndex ? { ...c, width: newWidth } : c
    );
  }

  public findColumnIndex(columns: GridColumn[], columnId: string): number {
    return columns.findIndex(c => c.id === columnId);
  }
} 