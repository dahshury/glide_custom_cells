import { GridCell, GridCellKind, EditableGridCell, Theme } from "@glideapps/glide-data-grid";
import { IColumnType } from "../interfaces/IColumnType";
import { ColumnDataType, IColumnDefinition, IColumnFormatting } from "../interfaces/IDataSource";
import { TempusDateCell } from "../../TempusDominusDateCell";
import { FormattingService } from "../../services/FormattingService";

export class TimeColumnType implements IColumnType {
  id = "time";
  dataType = ColumnDataType.TIME;

  createCell(
    value: any,
    column: IColumnDefinition,
    theme: Partial<Theme>,
    isDarkTheme: boolean
  ): GridCell {
    const time = this.parseValue(value, column);
    const displayTime = this.formatValue(time, column.formatting);

    const cell = {
      kind: GridCellKind.Custom,
      data: {
        kind: "tempus-date-cell",
        format: "time",
        date: time,
        displayDate: displayTime,
        isDarkTheme: isDarkTheme,
      },
      copyData: displayTime,
      allowOverlay: true,
    } as TempusDateCell;

    if (column.isRequired && !time) {
      (cell as any).isMissingValue = true;
    }

    return cell;
  }

  getCellValue(cell: GridCell): any {
    if (cell.kind === GridCellKind.Custom && (cell as any).data?.kind === "tempus-date-cell") {
      return (cell as any).data.date;
    }
    return null;
  }

  validateValue(value: any, column: IColumnDefinition): { isValid: boolean; error?: string } {
    if (column.isRequired && !value) {
      return { isValid: false, error: "Time is required" };
    }

    if (value && !(value instanceof Date) && !this.isValidTimeString(value)) {
      return { isValid: false, error: "Invalid time format" };
    }

    return { isValid: true };
  }

  formatValue(value: any, formatting?: IColumnFormatting): string {
    if (!value) return "";

    const date = value instanceof Date ? value : this.parseTimeString(value);
    if (!date || isNaN(date.getTime())) return "";

    if (formatting?.type) {
      return FormattingService.formatValue(date, "time", formatting.type);
    }

    if (formatting?.pattern) {
      return FormattingService.formatValue(date, "time", formatting.pattern);
    }

    return date.toLocaleTimeString(formatting?.locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(formatting?.options || {})
    });
  }

  parseValue(input: any, column: IColumnDefinition): any {
    if (!input) return null;
    if (input instanceof Date) return input;

    return this.parseTimeString(input);
  }

  getDefaultValue(column: IColumnDefinition): any {
    if (column.defaultValue === "now") {
      return new Date();
    }
    return column.defaultValue ? this.parseTimeString(column.defaultValue) : null;
  }

  canEdit(column: IColumnDefinition): boolean {
    return column.isEditable !== false;
  }

  createEditableCell(cell: GridCell, column: IColumnDefinition): EditableGridCell {
    return cell as EditableGridCell;
  }

  private isValidTimeString(value: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    return timeRegex.test(value);
  }

  private parseTimeString(value: string): Date | null {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    const match = value.match(timeRegex);
    
    if (!match) return null;

    const date = new Date(1970, 0, 1);
    date.setHours(parseInt(match[1], 10));
    date.setMinutes(parseInt(match[2], 10));
    if (match[4]) {
      date.setSeconds(parseInt(match[4], 10));
    }

    return date;
  }
} 