import { GridCell, GridCellKind, EditableGridCell, Theme } from "@glideapps/glide-data-grid";
import { IColumnType } from "../interfaces/IColumnType";
import { ColumnDataType, IColumnDefinition, IColumnFormatting } from "../interfaces/IDataSource";
import { PhoneInputCell } from "../../PhoneInputCell";

export class PhoneColumnType implements IColumnType {
  id = "phone";
  dataType = ColumnDataType.PHONE;

  createCell(
    value: any,
    column: IColumnDefinition,
    theme: Partial<Theme>,
    isDarkTheme: boolean
  ): GridCell {
    const phone = this.formatValue(value, column.formatting);

    const cell = {
      kind: GridCellKind.Custom,
      data: {
        kind: "phone-input-cell",
        phone: phone,
        displayPhone: phone,
        isDarkTheme: isDarkTheme,
      },
      copyData: phone,
      allowOverlay: true,
    } as PhoneInputCell;

    if (column.isRequired && !phone) {
      (cell as any).isMissingValue = true;
    }

    return cell;
  }

  getCellValue(cell: GridCell): any {
    if (cell.kind === GridCellKind.Custom && (cell as any).data?.kind === "phone-input-cell") {
      return (cell as any).data.phone;
    }
    return "";
  }

  validateValue(value: any, column: IColumnDefinition): { isValid: boolean; error?: string } {
    if (column.isRequired && !value) {
      return { isValid: false, error: "Phone number is required" };
    }

    if (value) {
      const phoneRegex = /^\+?[\d\s\-().]+$/;
      if (!phoneRegex.test(value)) {
        return { isValid: false, error: "Invalid phone number format" };
      }

      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return { isValid: false, error: "Phone number must be between 10 and 15 digits" };
      }
    }

    return { isValid: true };
  }

  formatValue(value: any, formatting?: IColumnFormatting): string {
    if (!value) return "";

    const cleaned = String(value).replace(/\D/g, "");
    
    if (formatting?.pattern === "international" && cleaned.length >= 10) {
      const country = cleaned.substring(0, 1);
      const area = cleaned.substring(1, 4);
      const first = cleaned.substring(4, 7);
      const second = cleaned.substring(7, 11);
      return `+${country} (${area}) ${first}-${second}`;
    }

    if (cleaned.length === 10) {
      const area = cleaned.substring(0, 3);
      const first = cleaned.substring(3, 6);
      const second = cleaned.substring(6, 10);
      return `(${area}) ${first}-${second}`;
    }

    return value;
  }

  parseValue(input: string, column: IColumnDefinition): any {
    return input.replace(/\D/g, "");
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