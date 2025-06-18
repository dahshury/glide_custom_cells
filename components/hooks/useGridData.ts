import React from "react";
import { GridCell, GridCellKind, Item, EditableGridCell } from "@glideapps/glide-data-grid";
import { DropdownCell as DropdownRenderer } from "@glideapps/glide-data-grid-cells";
import TempusDateCellRenderer, { type TempusDateCell } from "../TempusDominusDateCell";
import PhoneInputCellRenderer, { type PhoneInputCell } from "../PhoneInputCell";
import { Theme } from "@glideapps/glide-data-grid";
import { EditingState } from "../models/EditingState";
import { FormattingService } from "../services/FormattingService";

const validateNameField = (text: string): { isValid: boolean; correctedValue?: string; errorMessage?: string } => {
    if (!text || text.trim() === "") {
        return { isValid: false, errorMessage: "Name is required" };
    }

    let trimmed = text.trim();
    
    // Remove any numerical characters and coerce the name
    if (/\d/.test(trimmed)) {
        trimmed = trimmed.replace(/\d/g, "");
    }
    
    // Clean up extra spaces and normalize separators
    trimmed = trimmed.replace(/\s+/g, " ").trim();
    
    // Auto-capitalize each word (handles both spaces and hyphens)
    const capitalized = trimmed.replace(/\b[\p{L}]/gu, (char) => char.toUpperCase());

    // Split into words (supports spaces and hyphens for compound names)
    const words = capitalized.split(/[\s-]+/).filter(word => word.length > 0);
    
    // Must have at least 2 words
    if (words.length < 2) {
        // Try to coerce by adding a default last name if only one word
        if (words.length === 1 && words[0].length >= 2) {
            return { isValid: true, correctedValue: `${words[0]} Doe` };
        }
        return { isValid: false, errorMessage: "Name must contain at least two words" };
    }

    // Each word must be at least 2 characters and contain only letters
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.length < 2) {
            // Try to coerce by removing short words or combining them
            words.splice(i, 1);
            i--; // Adjust index after removal
            continue;
        }
        
        // Must contain only Unicode letters and hyphens
        if (!/^[\p{L}-]+$/u.test(word)) {
            // Remove invalid characters
            words[i] = word.replace(/[^\p{L}-]/gu, "");
            if (words[i].length < 2) {
                words.splice(i, 1);
                i--;
            }
        }
    }
    
    // Ensure we still have at least 2 valid words after coercion
    if (words.length < 2) {
        return { isValid: false, errorMessage: "Name must contain at least two valid words" };
    }

    // Reconstruct the name with proper spacing
    const finalName = words.join(" ");
    return { isValid: true, correctedValue: finalName };
};

const generateSampleData = (row: number, col: number): any => {
    const seed = row * 1000 + col;
    const random = () => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Sample names for the first column
    const sampleNames = [
        "John Smith", "Maria Garcia", "Ahmed Hassan", "Sarah Johnson", "Chen Wei",
        "Anna Kowalski", "David Brown", "Fatima Al-Zahra", "Pierre Dubois", "Yuki Tanaka",
        "Elena Rodriguez", "Michael Davis", "Priya Sharma", "Lars Andersen", "Sofia Rossi",
        "James Wilson", "Aisha Okafor", "Carlos Mendez", "Emma Thompson", "Ali Rahman"
    ];

    switch (col) {
        case 0: return sampleNames[row % sampleNames.length];
        case 1: return ["Option A", "Option B", "Option C"][Math.floor(random() * 3)];
        case 2: return Math.round((random() * 10000 + 100) * 100) / 100; // Amount: $100-$10,100
        case 3: return new Date(2020 + Math.floor(random() * 4), Math.floor(random() * 12), Math.floor(random() * 28) + 1);
        case 4: return new Date(1970, 0, 1, Math.floor(random() * 24), Math.floor(random() * 60));
        case 5: return `+1${Math.floor(4160000000 + random() * 1000000000)}`;
        default: return `Cell ${row},${col}`;
    }
};

const formatNumber = (value: number, format?: string): string => {
    if (value === null || value === undefined || isNaN(value)) return "";
    
    switch (format) {
        case "currency":
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
        case "dollar":
            return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
        case "euro":
            return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(value);
        case "yen":
            return new Intl.NumberFormat(undefined, { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
        case "percent":
            return new Intl.NumberFormat(undefined, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
        case "compact":
            return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
        case "plain":
        case "localized":
        case "automatic":
            return new Intl.NumberFormat(undefined).format(value);
        case "percentage":
            return new Intl.NumberFormat(undefined, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
        case "scientific":
            return value.toExponential(2);
        case "number":
        default:
            return new Intl.NumberFormat(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
    }
};

function getInitialCell(col: number, row: number, theme: Partial<Theme>, darkTheme: Partial<Theme>, columnFormats?: Record<string, string>, columnId?: string): GridCell {
    const data = generateSampleData(row, col);

    switch (col) {
        case 0: // Text
            return {
                kind: GridCellKind.Text,
                data: data,
                displayData: data,
                allowOverlay: true,
            };
        case 1: // Dropdown
            return {
                kind: GridCellKind.Custom,
                data: {
                    kind: "dropdown-cell",
                    allowedValues: ["Option A", "Option B", "Option C"],
                    value: data,
                },
                copyData: data,
                allowOverlay: true,
            } as any;
        case 2: // Number (Amount)
            const format = columnFormats?.[columnId || "number"] || columnFormats?.["number"] || "number";
            return {
                kind: GridCellKind.Number,
                data: data,
                displayData: formatNumber(data, format),
                allowOverlay: true,
            };
        case 3: // Date Picker (Date)
            const dateFormat = columnFormats?.[columnId || "date"] || columnFormats?.["date"];
            const formattedDate = dateFormat && data instanceof Date 
                ? FormattingService.formatValue(data, "date", dateFormat) 
                : (data instanceof Date ? data.toLocaleDateString() : "");
            return {
                kind: GridCellKind.Custom,
                data: {
                    kind: "tempus-date-cell",
                    format: "date",
                    date: data,
                    displayDate: formattedDate,
                    isDarkTheme: theme === darkTheme,
                },
                copyData: formattedDate,
                allowOverlay: true,
            } as TempusDateCell;
        case 4: // Time Picker (Time)
            const timeFormat = columnFormats?.[columnId || "time"] || columnFormats?.["time"];
            const formattedTime = timeFormat && data instanceof Date 
                ? FormattingService.formatValue(data, "time", timeFormat) 
                : (data instanceof Date ? data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "");
            return {
                kind: GridCellKind.Custom,
                data: {
                    kind: "tempus-date-cell",
                    format: "time",
                    date: data,
                    displayDate: formattedTime,
                    isDarkTheme: theme === darkTheme,
                },
                copyData: formattedTime,
                allowOverlay: true,
            } as TempusDateCell;
        case 5: // Phone
            return {
                kind: GridCellKind.Custom,
                data: {
                    kind: "phone-input-cell",
                    phone: data,
                    displayPhone: data,
                    isDarkTheme: theme === darkTheme,
                },
                copyData: data,
                allowOverlay: true,
            } as PhoneInputCell;
        default:
            return {
                kind: GridCellKind.Text,
                data: data,
                displayData: data,
                allowOverlay: true,
            };
    }
}

export function useGridData(visibleColumnIndices: number[], theme: Partial<Theme>, darkTheme: Partial<Theme>, initialNumRows: number, columnFormats?: Record<string, string>, columns?: any[]) {
    const editingState = React.useRef(new EditingState(initialNumRows));

    const getRawCellContent = React.useCallback((col: number, row: number): GridCell => {
        const storedCell = editingState.current.getCell(col, row);
        if (storedCell) {
            // Ensure numeric cells have formatted display
            if (storedCell.kind === GridCellKind.Number) {
                // @ts-ignore – data property exists for number cell types
                const raw = (storedCell as any).data;
                const columnId = columns?.[col]?.id;
                const format = columnFormats?.[columnId || "number"] || columnFormats?.["number"] || "number";
                const formatted = raw !== undefined && raw !== null ? formatNumber(raw, format) : "";
                // @ts-ignore
                storedCell.displayData = formatted;
            }
            
            // Update date/time cell formatting
            if (storedCell.kind === GridCellKind.Custom && (storedCell as any).data?.kind === "tempus-date-cell") {
                const cellData = (storedCell as any).data;
                const date = cellData.date;
                if (date instanceof Date) {
                    const columnId = columns?.[col]?.id;
                    let format: string | undefined;
                    let columnType: string;
                    
                    if (cellData.format === "date") {
                        format = columnFormats?.[columnId || "date"] || columnFormats?.["date"];
                        columnType = "date";
                    } else if (cellData.format === "time") {
                        format = columnFormats?.[columnId || "time"] || columnFormats?.["time"];
                        columnType = "time";
                    } else {
                        format = columnFormats?.[columnId || "datetime"] || columnFormats?.["datetime"];
                        columnType = "datetime";
                    }
                    
                    if (format) {
                        const formattedValue = FormattingService.formatValue(date, columnType, format);
                        cellData.displayDate = formattedValue;
                        (storedCell as any).copyData = formattedValue;
                    } else {
                        // Use default formatting
                        if (cellData.format === "date") {
                            cellData.displayDate = date.toLocaleDateString();
                        } else if (cellData.format === "time") {
                            cellData.displayDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } else {
                            cellData.displayDate = date.toLocaleString();
                        }
                        (storedCell as any).copyData = cellData.displayDate;
                    }
                }
            }
            
            // Update missing value flag and validation for required columns
            if (col === 0 && storedCell.kind === GridCellKind.Text) { // Name column validation
                const data = (storedCell as any).data || "";
                const validation = validateNameField(data);
                
                if (!validation.isValid) {
                    (storedCell as any).isMissingValue = true;
                    (storedCell as any).themeOverride = { textColor: "#ef4444" };
                    (storedCell as any).errorMessage = validation.errorMessage;
                } else {
                    (storedCell as any).isMissingValue = false;
                    if (validation.correctedValue && validation.correctedValue !== data) {
                        (storedCell as any).data = validation.correctedValue;
                        (storedCell as any).displayData = validation.correctedValue;
                    }
                }
            }
            
            return storedCell;
        }
        const columnId = columns?.[col]?.id;
        const cell = getInitialCell(col, row, theme, darkTheme, columnFormats, columnId);
        if (cell.kind === GridCellKind.Number) {
            // @ts-ignore
            const raw = (cell as any).data;
            const format = columnFormats?.[columnId || "number"] || columnFormats?.["number"] || "number";
            // @ts-ignore
            cell.displayData = raw !== undefined && raw !== null ? formatNumber(raw, format) : "";
        }

        // Mark missing values and validate for required columns
        if (col === 0 && cell.kind === GridCellKind.Text) { // Name column validation
            const data = (cell as any).data || "";
            const validation = validateNameField(data);
            
            if (!validation.isValid) {
                (cell as any).isMissingValue = true;
                (cell as any).themeOverride = { textColor: "#ef4444" };
                (cell as any).errorMessage = validation.errorMessage;
            } else {
                (cell as any).isMissingValue = false;
                if (validation.correctedValue && validation.correctedValue !== data) {
                    (cell as any).data = validation.correctedValue;
                    (cell as any).displayData = validation.correctedValue;
                }
            }
        }
        return cell;
    }, [theme, darkTheme, columnFormats, columns]);

    const normalizeEditedCell = (cell: EditableGridCell, col?: number): GridCell => {
        // Ensure essential props like displayData are present so the grid renders the updated value immediately
        switch (cell.kind) {
            case GridCellKind.Text: {
                let text = (cell as any).data ?? "";
                let hasError = false;
                let errorMessage = "";
                
                // Apply name validation for column 0 (name field)
                if (col === 0) {
                    const validation = validateNameField(text);
                    if (!validation.isValid) {
                        hasError = true;
                        errorMessage = validation.errorMessage || "Invalid name";
                    } else if (validation.correctedValue) {
                        text = validation.correctedValue;
                    }
                }
                
                return {
                    kind: GridCellKind.Text,
                    data: text,
                    displayData: text,
                    allowOverlay: true,
                    ...(hasError && { 
                        themeOverride: { textColor: "#ef4444" },
                        hoverEffect: false
                    }),
                    ...(col === 0 && hasError && { 
                        isMissingValue: true,
                        errorMessage 
                    })
                } as GridCell;
            }
            case GridCellKind.Number: {
                const num = (cell as any).data ?? 0;
                const columnId = columns?.[col || 0]?.id;
                const format = columnFormats?.[columnId || "number"] || columnFormats?.["number"] || "number";
                return {
                    kind: GridCellKind.Number,
                    data: num,
                    displayData: formatNumber(num, format),
                    allowOverlay: true,
                } as GridCell;
            }
            case GridCellKind.Custom: {
                // Handle date/time cells
                if ((cell as any).data?.kind === "tempus-date-cell") {
                    const cellData = (cell as any).data;
                    const date = cellData.date;
                    if (date instanceof Date) {
                        const columnId = columns?.[col || 0]?.id;
                        let format: string | undefined;
                        let columnType: string;
                        
                        if (cellData.format === "date") {
                            format = columnFormats?.[columnId || "date"] || columnFormats?.["date"];
                            columnType = "date";
                        } else if (cellData.format === "time") {
                            format = columnFormats?.[columnId || "time"] || columnFormats?.["time"];
                            columnType = "time";
                        } else {
                            format = columnFormats?.[columnId || "datetime"] || columnFormats?.["datetime"];
                            columnType = "datetime";
                        }
                        
                        let formattedValue: string;
                        if (format) {
                            formattedValue = FormattingService.formatValue(date, columnType, format);
                        } else {
                            // Use default formatting
                            if (cellData.format === "date") {
                                formattedValue = date.toLocaleDateString();
                            } else if (cellData.format === "time") {
                                formattedValue = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else {
                                formattedValue = date.toLocaleString();
                            }
                        }
                        
                        cellData.displayDate = formattedValue;
                        return {
                            ...cell,
                            data: cellData,
                            copyData: formattedValue,
                        } as unknown as GridCell;
                    }
                }
                return cell as unknown as GridCell;
            }
            default:
                // For other cells, assume full data provided
                return cell as unknown as GridCell;
        }
    };

    const onCellEdited = React.useCallback((visibleRows: readonly number[]) => (cell: Item, newValue: EditableGridCell) => {
        const [displayCol, displayRow] = cell;
        const actualCol = visibleColumnIndices[displayCol];
        const actualRow = visibleRows[displayRow];

        if (actualRow !== undefined && actualCol !== undefined) {
            const normalized = normalizeEditedCell(newValue, actualCol);
            editingState.current.setCell(actualCol, actualRow, normalized);
        }
    }, [visibleColumnIndices, columnFormats, columns]);

    const getCellContent = React.useCallback((visibleRows: readonly number[]) => (cell: Item): GridCell => {
        const [displayCol, displayRow] = cell;
        const actualCol = visibleColumnIndices[displayCol];
        const actualRow = visibleRows[displayRow];

        if (actualRow === undefined || actualCol === undefined) {
            return { kind: GridCellKind.Text, data: "", displayData: "", allowOverlay: false };
        }

        return getRawCellContent(actualCol, actualRow);
    }, [visibleColumnIndices, getRawCellContent]);

    return { editingState, getCellContent, onCellEdited, getRawCellContent };
}