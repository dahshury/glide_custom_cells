import { GridCell, GridCellKind, EditableGridCell, Theme } from "@glideapps/glide-data-grid";
import { IColumnType } from "../interfaces/IColumnType";
import { ColumnDataType, IColumnDefinition, IColumnFormatting } from "../interfaces/IDataSource";
import { TempusDateCell } from "../../TempusDominusDateCell";
import { FormattingService } from "../../services/FormattingService";

export class DateColumnType implements IColumnType {
  id = "date";
  dataType = ColumnDataType.DATE;

  createCell(
    value: any,
    column: IColumnDefinition,
    theme: Partial<Theme>,
    isDarkTheme: boolean
  ): GridCell {
    const date = this.parseValue(value, column);
    const displayDate = this.formatValue(date, column.formatting);

    const cell = {
      kind: GridCellKind.Custom,
      data: {
        kind: "tempus-date-cell",
        format: "date",
        date: date,
        displayDate: displayDate,
        isDarkTheme: isDarkTheme,
      },
      copyData: displayDate,
      allowOverlay: true,
    } as TempusDateCell;

    if (column.isRequired && !date) {
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
      return { isValid: false, error: "Date is required" };
    }

    if (value && !(value instanceof Date) && !Date.parse(value)) {
      return { isValid: false, error: "Invalid date" };
    }

    const date = value instanceof Date ? value : new Date(value);

    if (column.validationRules) {
      for (const rule of column.validationRules) {
        switch (rule.type) {
          case "min":
            if (rule.value) {
              const minDate = new Date(rule.value);
              if (date < minDate) {
                return { isValid: false, error: rule.message || `Date must be after ${minDate.toLocaleDateString()}` };
              }
            }
            break;
          case "max":
            if (rule.value) {
              const maxDate = new Date(rule.value);
              if (date > maxDate) {
                return { isValid: false, error: rule.message || `Date must be before ${maxDate.toLocaleDateString()}` };
              }
            }
            break;
          case "custom":
            if (rule.validate && !rule.validate(date)) {
              return { isValid: false, error: rule.message || "Invalid date" };
            }
            break;
        }
      }
    }

    return { isValid: true };
  }

  formatValue(value: any, formatting?: IColumnFormatting): string {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "";

    if (formatting?.type) {
      return FormattingService.formatValue(date, "date", formatting.type);
    }

    if (formatting?.pattern) {
      return FormattingService.formatValue(date, "date", formatting.pattern);
    }

    return date.toLocaleDateString(formatting?.locale);
  }

  parseValue(input: any, column: IColumnDefinition): any {
    if (!input) return null;
    if (input instanceof Date) return input;

    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  getDefaultValue(column: IColumnDefinition): any {
    if (column.defaultValue === "today") {
      return new Date();
    }
    return column.defaultValue ? new Date(column.defaultValue) : null;
  }

  canEdit(column: IColumnDefinition): boolean {
    return column.isEditable !== false;
  }

  createEditableCell(cell: GridCell, column: IColumnDefinition): EditableGridCell {
    return cell as EditableGridCell;
  }
} 