import { GridCell, GridCellKind, EditableGridCell, Theme } from "@glideapps/glide-data-grid";
import { IColumnType } from "../interfaces/IColumnType";
import { ColumnDataType, IColumnDefinition, IColumnFormatting } from "../interfaces/IDataSource";

export class DropdownColumnType implements IColumnType {
  id = "dropdown";
  dataType = ColumnDataType.DROPDOWN;

  createCell(
    value: any,
    column: IColumnDefinition,
    theme: Partial<Theme>,
    isDarkTheme: boolean
  ): GridCell {
    const options = column.metadata?.options || [];
    const selectedValue = value || column.defaultValue || "";

    const cell = {
      kind: GridCellKind.Custom,
      data: {
        kind: "dropdown-cell",
        allowedValues: options,
        value: selectedValue,
      },
      copyData: selectedValue,
      allowOverlay: true,
    } as any;

    if (column.isRequired && !selectedValue) {
      cell.isMissingValue = true;
    }

    return cell;
  }

  getCellValue(cell: GridCell): any {
    if (cell.kind === GridCellKind.Custom && (cell as any).data?.kind === "dropdown-cell") {
      return (cell as any).data.value;
    }
    return "";
  }

  validateValue(value: any, column: IColumnDefinition): { isValid: boolean; error?: string } {
    if (column.isRequired && !value) {
      return { isValid: false, error: "Please select an option" };
    }

    const options = column.metadata?.options || [];
    if (value && !options.includes(value)) {
      return { isValid: false, error: "Invalid selection" };
    }

    return { isValid: true };
  }

  formatValue(value: any, formatting?: IColumnFormatting): string {
    return String(value || "");
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