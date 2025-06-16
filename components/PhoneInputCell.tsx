import React from "react";
import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
  drawTextCell,
} from "@glideapps/glide-data-grid";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber, getCountryCallingCode, parsePhoneNumber } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";

interface PhoneInputCellProps {
  readonly kind: "phone-input-cell";
  readonly phone?: string;
  readonly displayPhone?: string;
  readonly readonly?: boolean;
  readonly countryCode?: string;
  readonly isDarkTheme?: boolean;
}

export type PhoneInputCell = CustomCell<PhoneInputCellProps>;

const editorStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  fontSize: "13px",
  fontFamily: "inherit",
  backgroundColor: "transparent",
  color: "inherit",
};

const baseWrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "calc(100% - 5px)",
  marginTop: "5px", // nudge down to align with grid cell border
  position: "relative",
};

const renderer: CustomRenderer<PhoneInputCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is PhoneInputCell => (c.data as any).kind === "phone-input-cell",
  
  draw: (args, cell) => {
    const { displayPhone, phone } = cell.data;
    const displayText = displayPhone || phone || "";
    
    // Draw the phone number as text. Highlight invalid numbers in red without mutating the shared theme
    const isValid = phone ? isValidPhoneNumber(phone) : true;

    const originalTheme = args.theme;

    if (!isValid && phone && phone.length > 0) {
      // Create a shallow copy of theme with red text color
      args.theme = { ...args.theme, textDark: "#ef4444" } as any;
    }

    drawTextCell(args, displayText, cell.contentAlign);

    // Restore original theme reference
    args.theme = originalTheme;
    
    return true;
  },

  measure: (ctx, cell, theme) => {
    const { displayPhone, phone } = cell.data;
    const displayText = displayPhone || phone || "";
    return ctx.measureText(displayText).width + theme.cellHorizontalPadding * 2;
  },

  provideEditor: () => ({
    editor: (props) => {
      const { data } = props.value;
      const { onFinishedEditing } = props;
      const [phoneValue, setPhoneValue] = React.useState<string>(data.phone || "");
      const wrapperRef = React.useRef<HTMLDivElement>(null);

      // Track the last known value and country for change detection
      const lastKnownValue = React.useRef<string>(data.phone || "");
      const lastKnownCountry = React.useRef<Country | undefined>(undefined);

      // Get initial country from phone number
      React.useEffect(() => {
        if (data.phone) {
          try {
            const parsed = parsePhoneNumber(data.phone);
            if (parsed) {
              lastKnownCountry.current = parsed.country;
            }
          } catch (error) {
            console.warn("Failed to parse initial phone number:", error);
          }
        }
      }, [data.phone]);

      const updateCell = React.useCallback((newPhone: string, shouldFinish = false) => {
        console.log("Updating cell with phone:", newPhone);
        
        // Format the display value
        let displayPhone = newPhone;
        if (newPhone && isValidPhoneNumber(newPhone)) {
          displayPhone = newPhone;
        }
        
        const newCell = {
          ...props.value,
          data: {
            ...data,
            phone: newPhone,
            displayPhone: displayPhone,
          },
        } as typeof props.value;

        console.log("Updating cell with:", newCell.data);
        props.onChange(newCell);
        
        if (shouldFinish) {
          console.log("Finishing edit with:", newCell.data);
          onFinishedEditing?.(newCell);
        }
      }, [props, data, onFinishedEditing]);

      // Simple backup check to ensure state consistency
      React.useEffect(() => {
        if (phoneValue !== lastKnownValue.current) {
          lastKnownValue.current = phoneValue;
        }
      }, [phoneValue]);

      const handleChange = (value: string | undefined) => {
        // Capture caret position before state change
        const inputElBefore = wrapperRef.current?.querySelector('input[type="text"]') as HTMLInputElement | null;
        const caretPos = inputElBefore?.selectionStart ?? null;

        // Handle the case where react-phone-number-input sends undefined
        // This can happen during country changes or when clearing the input
        if (value === undefined) {
          // Use a delay to allow DOM updates to complete
          setTimeout(() => {
            const inputs = wrapperRef.current?.querySelectorAll('input[type="text"]');
            if (inputs && inputs.length > 0) {
              const mainInput = inputs[0] as HTMLInputElement;
              const currentInputValue = mainInput.value;
              
              // Always use the current input value, regardless of what onChange sent
              // This handles country changes properly where the number gets reformatted
              const newPhone = currentInputValue || "";
              if (newPhone !== phoneValue) {
                setPhoneValue(newPhone);
                lastKnownValue.current = newPhone;
                updateCell(newPhone, false);

                // Restore caret position after state commit
                setTimeout(() => {
                  const inputElAfter = wrapperRef.current?.querySelector('input[type="text"]') as HTMLInputElement | null;
                  if (inputElAfter && caretPos !== null) {
                    const adjustedPos = Math.min(caretPos, inputElAfter.value.length);
                    inputElAfter.setSelectionRange(adjustedPos, adjustedPos);
                  }
                }, 0);
              }
            }
          }, 100); // Short delay to allow DOM updates
          
          return;
        }
        
        // Normal case: value is defined
        const newPhone = value || "";
        
        // Only update if the value actually changed
        if (newPhone !== phoneValue) {
          setPhoneValue(newPhone);
          lastKnownValue.current = newPhone;
          updateCell(newPhone, false);

          // Restore caret position after state commit
          setTimeout(() => {
            const inputElAfter = wrapperRef.current?.querySelector('input[type="text"]') as HTMLInputElement | null;
            if (inputElAfter && caretPos !== null) {
              const adjustedPos = Math.min(caretPos, inputElAfter.value.length);
              inputElAfter.setSelectionRange(adjustedPos, adjustedPos);
            }
          }, 0);
        }
      };

      const handleBlur = () => {
        console.log("Phone input blur with value:", phoneValue);
        updateCell(phoneValue, true);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          updateCell(phoneValue, true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          // Revert to original value
          const originalPhone = data.phone || "";
          setPhoneValue(originalPhone);
          updateCell(originalPhone, true);
        }
      };

      return (
        <div
          ref={wrapperRef}
          style={{
            ...baseWrapperStyle,
            backgroundColor: data.isDarkTheme ? "#1e1e1e" : "#ffffff", // Opaque bg to hide cell text
          }}
        >
          <div style={editorStyle}>
            <PhoneInput
              value={phoneValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Enter phone number"
              initialValueFormat="national"
              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      );
    },
    disablePadding: true,
    disableStyling: true,
  }),

  onPaste: (v, d) => {
    // Handle paste operations
    const pastedPhone = v.trim();
    let displayPhone = pastedPhone;
    
    if (pastedPhone && isValidPhoneNumber(pastedPhone)) {
      displayPhone = pastedPhone;
    }
    
    return {
      ...d,
      phone: pastedPhone,
      displayPhone: displayPhone,
    };
  },
};

export default renderer; 