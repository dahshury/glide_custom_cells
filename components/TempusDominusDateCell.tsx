import React from "react";
import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
  drawTextCell,
} from "@glideapps/glide-data-grid";

interface TempusDateCellProps {
  readonly kind: "tempus-date-cell";
  readonly date?: Date;
  readonly format?: "date" | "datetime" | "time";
  readonly displayDate?: string;
  readonly readonly?: boolean;
  readonly min?: Date;
  readonly max?: Date;
  readonly isDarkTheme?: boolean; // Add theme prop to control Tempus Dominus theme
}

export type TempusDateCell = CustomCell<TempusDateCellProps>;

const editorStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  outline: "none",
  padding: "8px",
  fontSize: "13px",
  fontFamily: "inherit",
  backgroundColor: "transparent",
  color: "inherit",
};

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "100%",
  position: "relative",
};

const renderer: CustomRenderer<TempusDateCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is TempusDateCell => (c.data as any).kind === "tempus-date-cell",
  
  draw: (args, cell) => {
    const { displayDate } = cell.data;
    drawTextCell(args, displayDate || "", cell.contentAlign);
    return true;
  },

  measure: (ctx, cell, theme) => {
    const { displayDate } = cell.data;
    return ctx.measureText(displayDate || "").width + theme.cellHorizontalPadding * 2;
  },

  provideEditor: () => ({
    editor: (props) => {
      const { data } = props.value;
      const { onFinishedEditing } = props;
      const inputRef = React.useRef<HTMLInputElement>(null);
      const wrapperRef = React.useRef<HTMLDivElement>(null);
      const [tempusInstance, setTempusInstance] = React.useState<any>(null);

      const toLocalDateInputValue = (date: Date): string =>
        date.toLocaleDateString("en-CA"); // YYYY-MM-DD

      const toLocalDateTimeInputValue = (date: Date): string => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
          date.getMinutes()
        )}`;
      };

      React.useEffect(() => {
        if (!inputRef.current) return;

        // Dynamically import Tempus Dominus
        const initTempusDominus = async () => {
          try {
            const { TempusDominus, DateTime, Namespace } = await import("@eonasdan/tempus-dominus");
            
            const options = {
              display: {
                components: {
                  calendar: data.format !== "time",
                  date: data.format !== "time",
                  month: data.format !== "time",
                  year: data.format !== "time",
                  decades: data.format !== "time",
                  clock: data.format !== "date",
                  hours: data.format !== "date",
                  minutes: data.format !== "date",
                  seconds: false,
                },
                theme: (data.isDarkTheme ? "dark" : "light") as "dark" | "light", // Use theme based on Grid component state
                buttons: {
                  today: true,
                  clear: false,
                  close: false,
                },
              },
              restrictions: {
                minDate: data.min ? new DateTime(data.min) : undefined,
                maxDate: data.max ? new DateTime(data.max) : undefined,
              },
              localization: {
                locale: "en-US",
              },
            };

            const instance = new TempusDominus(inputRef.current!, options);
            setTempusInstance(instance);
            
            // Set initial value
            if (data.date) {
              instance.dates.setValue(new DateTime(data.date));
            }

            // Subscribe to date change events - this fires when a date is selected
            const handleDateChange = (e: any) => {
              console.log("Tempus Dominus change event:", e);
              
              // The event object should contain the date information
              if (e.date) {
                // Convert DateTime to JavaScript Date
                const jsDate = new Date(e.date.valueOf());
                console.log("Date from event:", jsDate);
                
                const newCell = {
                  ...props.value,
                  data: {
                    ...data,
                    date: jsDate,
                    displayDate: formatDisplayDate(jsDate, data.format),
                  },
                } as typeof props.value;
                props.onChange(newCell);
                onFinishedEditing?.(newCell);
              } else if (e.isClear) {
                // Handle clear event
                const cleared = {
                  ...props.value,
                  data: { ...data, date: undefined, displayDate: "" },
                } as typeof props.value;
                props.onChange(cleared);
                onFinishedEditing?.(cleared);
              }
            };

            // Subscribe to hide event - this fires when picker closes
            const handleHide = (e: any) => {
              console.log("Tempus Dominus hide event:", e);
              
              // Get the current selected dates when picker closes
              const selectedDates = instance.dates.picked;
              console.log("Selected dates on hide:", selectedDates);
              
              if (selectedDates && selectedDates.length > 0) {
                const selectedDateTime = selectedDates[0];
                const jsDate = new Date(selectedDateTime.valueOf());
                
                console.log("Final date selection:", jsDate);
                
                const newCell = {
                  ...props.value,
                  data: {
                    ...data,
                    date: jsDate,
                    displayDate: formatDisplayDate(jsDate, data.format),
                  },
                } as typeof props.value;
                props.onChange(newCell);
                onFinishedEditing?.(newCell);
              }
            };

            // Subscribe to both change and hide events
            const changeSubscription = instance.subscribe(Namespace.events.change, handleDateChange);
            const hideSubscription = instance.subscribe(Namespace.events.hide, handleHide);
            
            // Also listen for input changes directly on the input field
            // This catches when Tempus Dominus updates the input value
            const handleInputChange = () => {
              console.log("Input value changed:", inputRef.current?.value);
              
              const inputValue = inputRef.current?.value;
              if (inputValue) {
                try {
                  const parsedDate = new Date(inputValue);
                  if (!isNaN(parsedDate.getTime())) {
                    console.log("Parsed date from input:", parsedDate);
                    
                    const newCell = {
                      ...props.value,
                      data: {
                        ...data,
                        date: parsedDate,
                        displayDate: formatDisplayDate(parsedDate, data.format),
                      },
                    } as typeof props.value;
                    props.onChange(newCell);
                    onFinishedEditing?.(newCell);
                  }
                } catch (error) {
                  console.warn("Failed to parse input date:", error);
                }
              }
            };
            
            // Listen for input events on the input field
            inputRef.current?.addEventListener('input', handleInputChange);
            inputRef.current?.addEventListener('change', handleInputChange);
            
            // Add a polling mechanism as a fallback to detect date changes
            let lastKnownDate: Date | undefined = data.date;
            const pollForChanges = setInterval(() => {
              const currentDates = instance.dates.picked;
              const currentDate = currentDates && currentDates.length > 0 
                ? new Date(currentDates[0].valueOf()) 
                : undefined;
              
              // Check if the date has changed
              const dateChanged = (lastKnownDate?.getTime() !== currentDate?.getTime()) ||
                                 (!lastKnownDate && currentDate) ||
                                 (lastKnownDate && !currentDate);
              
              if (dateChanged) {
                console.log("Polling detected date change:", { lastKnownDate, currentDate });
                lastKnownDate = currentDate;
                
                const newCell = {
                  ...props.value,
                  data: {
                    ...data,
                    date: currentDate,
                    displayDate: currentDate ? formatDisplayDate(currentDate, data.format) : "",
                  },
                } as typeof props.value;
                props.onChange(newCell);
                onFinishedEditing?.(newCell);
              }
            }, 500); // Check every 500ms
            
            // Store subscriptions for cleanup
            (instance as any)._changeSubscription = changeSubscription;
            (instance as any)._hideSubscription = hideSubscription;
            (instance as any)._inputHandler = handleInputChange;
            (instance as any)._pollInterval = pollForChanges;

          } catch (error) {
            console.warn("Tempus Dominus failed to load, falling back to native input:", error);
          }
        };

        initTempusDominus();

        return () => {
          if (tempusInstance) {
            try {
              // Unsubscribe from events
              if ((tempusInstance as any)._changeSubscription) {
                (tempusInstance as any)._changeSubscription.unsubscribe();
              }
              if ((tempusInstance as any)._hideSubscription) {
                (tempusInstance as any)._hideSubscription.unsubscribe();
              }
              // Remove input event listeners
              if (inputRef.current && (tempusInstance as any)._inputHandler) {
                inputRef.current.removeEventListener('input', (tempusInstance as any)._inputHandler);
                inputRef.current.removeEventListener('change', (tempusInstance as any)._inputHandler);
              }
              // Clear polling interval
              if ((tempusInstance as any)._pollInterval) {
                clearInterval((tempusInstance as any)._pollInterval);
              }
              // Dispose the instance
              tempusInstance.dispose();
            } catch (error) {
              console.error("Failed to dispose Tempus Dominus:", error);
            }
          }
        };
      }, []);

      const formatDisplayDate = (date: Date, format?: string): string => {
        if (!date) return "";
        
        switch (format) {
          case "time":
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          case "datetime":
            return date.toLocaleString();
          case "date":
          default:
            return date.toLocaleDateString();
        }
      };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only handle native input changes if Tempus Dominus is not loaded
        if (tempusInstance) return;

        const value = e.target.value;
        let newDate: Date | undefined;

        if (value) {
          if (data.format === "time") {
            // For time, create a date with today's date but the selected time
            const today = new Date();
            const [hours, minutes] = value.split(":").map(Number);
            newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
          } else if (data.format === "date") {
            const [year, month, day] = value.split("-").map(Number);
            newDate = new Date(year, month - 1, day);
          } else {
            // datetime-local produces local date/time already
            newDate = new Date(value);
          }
        }

        const newCell = {
          ...props.value,
          data: {
            ...data,
            date: newDate,
            displayDate: newDate ? formatDisplayDate(newDate, data.format) : "",
          },
        } as typeof props.value;
        props.onChange(newCell);
        onFinishedEditing?.(newCell);
      };

      const getInputType = () => {
        switch (data.format) {
          case "time": return "time";
          case "datetime": return "datetime-local";
          case "date":
          default: return "date";
        }
      };

      const getInputValue = () => {
        if (!data.date) return "";
        
        switch (data.format) {
          case "time":
            return data.date.toTimeString().slice(0, 5); // HH:MM
          case "datetime":
            return toLocalDateTimeInputValue(data.date); // local datetime string
          case "date":
          default:
            return toLocalDateInputValue(data.date); // local date string
        }
      };

      const getMinValue = () => {
        if (!data.min) return undefined;
        
        switch (data.format) {
          case "time":
            return data.min.toTimeString().slice(0, 5);
          case "datetime":
            return toLocalDateTimeInputValue(data.min);
          case "date":
          default:
            return toLocalDateInputValue(data.min);
        }
      };

      const getMaxValue = () => {
        if (!data.max) return undefined;
        
        switch (data.format) {
          case "time":
            return data.max.toTimeString().slice(0, 5);
          case "datetime":
            return toLocalDateTimeInputValue(data.max);
          case "date":
          default:
            return toLocalDateInputValue(data.max);
        }
      };

      if (data.readonly) {
        return (
          <div style={wrapperStyle}>
            <span style={editorStyle}>{data.displayDate || ""}</span>
          </div>
        );
      }

      return (
        <div ref={wrapperRef} style={wrapperStyle}>
          <input
            ref={inputRef}
            style={editorStyle}
            type={getInputType()}
            value={getInputValue()}
            min={getMinValue()}
            max={getMaxValue()}
            onChange={handleChange}
            autoFocus
            disabled={data.readonly}
            readOnly={!!tempusInstance}
          />
        </div>
      );
    },
    disablePadding: true
  }),

  onPaste: (v, d) => {
    let parsedDate: Date | undefined;
    
    if (v) {
      // Try to parse as timestamp first
      const timestamp = Number(v);
      if (!isNaN(timestamp)) {
        parsedDate = new Date(timestamp);
      } else {
        // Try to parse as date string
        const parsed = Date.parse(v);
        if (!isNaN(parsed)) {
          parsedDate = new Date(parsed);
        }
      }
    }

    const formatDisplayDate = (date: Date, format?: string): string => {
      if (!date) return "";
      
      switch (format) {
        case "time":
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case "datetime":
          return date.toLocaleString();
        case "date":
        default:
          return date.toLocaleDateString();
      }
    };

    return {
      ...d,
      date: parsedDate,
      displayDate: parsedDate ? formatDisplayDate(parsedDate, d.format) : "",
    };
  },
};

export default renderer; 