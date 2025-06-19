import { GridCell, GridCellKind, EditableGridCell, Theme } from "@glideapps/glide-data-grid";
import { IColumnType } from "../interfaces/IColumnType";
import { ColumnDataType, IColumnDefinition, IColumnFormatting } from "../interfaces/IDataSource";

export class TextColumnType implements IColumnType {
  id = "text";
  dataType = ColumnDataType.TEXT;

  createCell(
    value: any,
    column: IColumnDefinition,
    theme: Partial<Theme>,
    isDarkTheme: boolean
  ): GridCell {
    const text = this.formatValue(value, column.formatting);
    
    const cell: GridCell = {
      kind: GridCellKind.Text,
      data: text,
      displayData: text,
      allowOverlay: true,
    };

    if (column.isRequired && !text) {
      (cell as any).isMissingValue = true;
      (cell as any).themeOverride = { textColor: "#ef4444" };
    }

    return cell;
  }

  getCellValue(cell: GridCell): any {
    return (cell as any).data || "";
  }

  validateValue(value: any, column: IColumnDefinition): { isValid: boolean; error?: string } {
    const text = String(value || "");

    if (column.isRequired && !text.trim()) {
      return { isValid: false, error: "This field is required" };
    }

    if (column.validationRules) {
      for (const rule of column.validationRules) {
        switch (rule.type) {
          case "pattern":
            if (rule.value && !new RegExp(rule.value).test(text)) {
              return { isValid: false, error: rule.message || "Invalid format" };
            }
            break;
          case "min":
            if (rule.value && text.length < rule.value) {
              return { isValid: false, error: rule.message || `Minimum ${rule.value} characters required` };
            }
            break;
          case "max":
            if (rule.value && text.length > rule.value) {
              return { isValid: false, error: rule.message || `Maximum ${rule.value} characters allowed` };
            }
            break;
          case "custom":
            if (rule.validate && !rule.validate(text)) {
              return { isValid: false, error: rule.message || "Invalid value" };
            }
            break;
        }
      }
    }

    return { isValid: true };
  }

  formatValue(value: any, formatting?: IColumnFormatting): string {
    if (value === null || value === undefined) return "";
    
    let formatted = String(value);

    if (formatting?.type === "uppercase") {
      formatted = formatted.toUpperCase();
    } else if (formatting?.type === "lowercase") {
      formatted = formatted.toLowerCase();
    } else if (formatting?.type === "capitalize") {
      formatted = formatted.replace(/\b\w/g, char => char.toUpperCase());
    }

    return formatted;
  }

  parseValue(input: string, column: IColumnDefinition): any {
    return input;
  }

  getDefaultValue(column: IColumnDefinition): any {
    return column.defaultValue || "";
  }

  canEdit(column: IColumnDefinition): boolean {
    return column.isEditable !== false;
  }

  createEditableCell(cell: GridCell, column: IColumnDefinition): EditableGridCell {
    return cell as EditableGridCell;
  }
} 