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
import { PhoneInputService } from "@/components/services/PhoneInputService";
import { PHONE_INPUT_EDITOR_CONFIG } from "@/components/models/PhoneInputEditorProps";

interface PhoneInputCellProps {
  readonly kind: "phone-input-cell";
  readonly phone?: string;
  readonly displayPhone?: string;
  readonly readonly?: boolean;
  readonly countryCode?: string;
  readonly isDarkTheme?: boolean;
}

export type PhoneInputCell = CustomCell<PhoneInputCellProps>;

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
    const textWidth = ctx.measureText(displayText).width;
    const padding = theme.cellHorizontalPadding * 2;
    // Reduce total width by 30%
    return (textWidth + padding) * 0.7;
  },

  provideEditor: () => ({
    editor: React.memo((props) => {
      const { data } = props.value;
      const { onFinishedEditing } = props;
      const [phoneValue, setPhoneValue] = React.useState<string>(data.phone || "");
      const wrapperRef = React.useRef<HTMLDivElement>(null);
      const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
            // Silently handle parse errors
          }
        }
      }, [data.phone]);

      const updateCell = React.useCallback((newPhone: string, shouldFinish = false) => {
        // Clear any pending update
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
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

        props.onChange(newCell);
        
        if (shouldFinish) {
          onFinishedEditing?.(newCell);
        }
      }, [props, data, onFinishedEditing]);

      // Simple backup check to ensure state consistency and cleanup
      React.useEffect(() => {
        if (phoneValue !== lastKnownValue.current) {
          lastKnownValue.current = phoneValue;
        }
        
        // Cleanup timeout on unmount
        return () => {
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
        };
      }, [phoneValue]);

      const handleChange = React.useCallback((value: string | undefined) => {
        // Handle the case where react-phone-number-input sends undefined
        // This can happen during country changes or when clearing the input
        if (value === undefined) {
          // Use requestAnimationFrame for smoother updates
          requestAnimationFrame(() => {
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
                
                // Debounce the cell update
                if (updateTimeoutRef.current) {
                  clearTimeout(updateTimeoutRef.current);
                }
                updateTimeoutRef.current = setTimeout(() => {
                  updateCell(newPhone, false);
                }, PhoneInputService.getDebounceDelay());
              }
            }
          });
          
          return;
        }
        
        // Normal case: value is defined
        const newPhone = value || "";
        
        // Only update if the value actually changed
        if (newPhone !== phoneValue) {
          setPhoneValue(newPhone);
          lastKnownValue.current = newPhone;
          
          // Debounce the cell update for better performance
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          updateTimeoutRef.current = setTimeout(() => {
            updateCell(newPhone, false);
          }, PhoneInputService.getDebounceDelay());
        }
      }, [phoneValue, updateCell]);

      const handleBlur = React.useCallback(() => {
        // Clear any pending updates
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateCell(phoneValue, true);
      }, [phoneValue, updateCell]);

      const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          // Clear any pending updates
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          updateCell(phoneValue, true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          // Clear any pending updates
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          // Revert to original value
          const originalPhone = data.phone || "";
          setPhoneValue(originalPhone);
          updateCell(originalPhone, true);
        }
      }, [phoneValue, data.phone, updateCell]);

      const styles = PhoneInputService.getEditorStyles(data.isDarkTheme || false);
      
      return (
        <div
          ref={wrapperRef}
          style={{
            display: "flex",
            alignItems: "center",
            width: PHONE_INPUT_EDITOR_CONFIG.customWidth ? `${PHONE_INPUT_EDITOR_CONFIG.customWidth}px` : "100%",
            maxWidth: PHONE_INPUT_EDITOR_CONFIG.customWidth ? `${PHONE_INPUT_EDITOR_CONFIG.customWidth}px` : "100%",
            height: "100%",
            backgroundColor: data.isDarkTheme ? "#1e1e1e" : "#ffffff",
            padding: "0 8px",
            boxSizing: "border-box",
            overflow: "hidden"
          }}
        >
          <PhoneInput
            value={phoneValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter phone number"
            initialValueFormat="national"
            className="phone-input w-full border-none focus:ring-0 focus:outline-none bg-transparent"
            style={{
              transform: "translateY(3px)",
              maxWidth: "100%"
            }}
          />
        </div>
      );
    }),
    disablePadding: PHONE_INPUT_EDITOR_CONFIG.disablePadding,
    disableStyling: PHONE_INPUT_EDITOR_CONFIG.disableStyling,
    needsEscapeKey: PHONE_INPUT_EDITOR_CONFIG.needsEscapeKey,
    needsTabKey: PHONE_INPUT_EDITOR_CONFIG.needsTabKey,
    portalElement: PHONE_INPUT_EDITOR_CONFIG.portalElement,
    width: PHONE_INPUT_EDITOR_CONFIG.customWidth,
    maxWidth: PHONE_INPUT_EDITOR_CONFIG.maxWidth,
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