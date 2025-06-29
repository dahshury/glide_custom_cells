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
  readonly isDarkTheme?: boolean;
}

export type TempusDateCell = CustomCell<TempusDateCellProps>;

const editorStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  outline: "none",
  padding: "8px",
  paddingRight: "36px",
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

const iconButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "inherit",
  opacity: 0.7,
  transition: "opacity 0.2s",
  width: "24px",
  height: "24px",
  borderRadius: "4px",
};

// CSS to hide native date picker controls
const hideNativeDatePickerCSS = `
  /* Chrome, Safari, Edge, Opera */
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator,
  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    display: none;
    -webkit-appearance: none;
  }
  
  /* Firefox */
  input[type="date"]::-moz-calendar-picker-indicator,
  input[type="time"]::-moz-calendar-picker-indicator,
  input[type="datetime-local"]::-moz-calendar-picker-indicator {
    display: none;
  }
  
  /* Remove the clear button in Edge */
  input[type="date"]::-ms-clear,
  input[type="time"]::-ms-clear,
  input[type="datetime-local"]::-ms-clear {
    display: none;
  }
`;

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
      const iconButtonRef = React.useRef<HTMLButtonElement>(null);
      const [tempusInstance, setTempusInstance] = React.useState<any>(null);

      const toLocalDateInputValue = (date: Date): string =>
        date.toLocaleDateString("en-GB"); // DD/MM/YYYY

      const toLocalDateTimeInputValue = (date: Date): string => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
          date.getMinutes()
        )}`;
      };

      // Inject CSS to hide native date picker controls
      React.useEffect(() => {
        if (!document.getElementById('hide-native-date-picker')) {
          const style = document.createElement('style');
          style.id = 'hide-native-date-picker';
          style.textContent = hideNativeDatePickerCSS;
          document.head.appendChild(style);
        }
      }, []);

      const handleIconClick = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const event = e.nativeEvent;
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
        
        if (!inputRef.current) return;

        // Don't reinitialize if already initialized
        if (tempusInstance) {
          tempusInstance.toggle();
          return;
        }

        // Dynamically import Tempus Dominus
        try {
          const { TempusDominus, DateTime, Namespace } = await import("@eonasdan/tempus-dominus");
          
          // Inject animation CSS if not already present
          if (!document.getElementById('tempus-dominus-animations')) {
            const style = document.createElement('style');
            style.id = 'tempus-dominus-animations';
            style.textContent = `
              @keyframes tempusFadeSlideIn {
                from {
                  opacity: 0;
                  transform: translateY(-10px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              
              @keyframes tempusFadeSlideOut {
                from {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
                to {
                  opacity: 0;
                  transform: translateY(-10px) scale(0.95);
                }
              }
              
              .tempus-dominus-widget-animated-in {
                animation: tempusFadeSlideIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
              }
              
              .tempus-dominus-widget-animated-out {
                animation: tempusFadeSlideOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards !important;
              }
              
              .tempus-dominus-widget-transition {
                transition: opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), 
                            transform 250ms cubic-bezier(0.16, 1, 0.3, 1) !important;
              }
              
              .tempus-dominus-widget-hidden {
                opacity: 0 !important;
                transform: translateY(-10px) scale(0.95) !important;
              }
              
              .tempus-dominus-widget-visible {
                opacity: 1 !important;
                transform: translateY(0) scale(1) !important;
              }
              
              body > .tempus-dominus-widget,
              body > [class*="tempus-dominus"],
              body > .dropdown-menu {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
              }
              
              body > .tempus-dominus-widget.tempus-dominus-widget-animated-in,
              body > [class*="tempus-dominus"].tempus-dominus-widget-animated-in,
              body > .dropdown-menu.tempus-dominus-widget-animated-in {
                animation: tempusFadeSlideIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
              }
              
              body > .tempus-dominus-widget.tempus-dominus-widget-visible,
              body > [class*="tempus-dominus"].tempus-dominus-widget-visible,
              body > .dropdown-menu.tempus-dominus-widget-visible {
                opacity: 1 !important;
                transform: translateY(0) scale(1) !important;
              }
              
              .tempus-dominus-widget[style*="display: block"] {
                visibility: visible !important;
              }
              
              .tempus-dominus-widget {
                position: fixed !important;
              }
            `;
            document.head.appendChild(style);
          }
          
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
              theme: (document.documentElement.classList.contains('dark') ? 'dark' : 'light') as 'dark' | 'light',
              buttons: {
                today: true,
                clear: false,
                close: false,
              },
              placement: 'bottom' as 'bottom',
              keepOpen: true,
            },
            restrictions: {
              minDate: data.min ? new DateTime(data.min) : undefined,
              maxDate: data.max ? new DateTime(data.max) : undefined,
            },
            localization: {
              locale: "en-GB",
              format: data.format === "time" ? "HH:mm" : data.format === "date" ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm",
            },
            container: document.body,
          };

          const instance = new TempusDominus(inputRef.current!, options);
          setTempusInstance(instance);
          
          // Force the widget to be appended to body if it's not already
          setTimeout(() => {
            const widgets = document.querySelectorAll('.tempus-dominus-widget, [class*="tempus-dominus"]');
            widgets.forEach((widget) => {
              if (widget.parentElement !== document.body) {
                document.body.appendChild(widget);
              }
            });
          }, 0);

          // Set initial value
          if (data.date) {
            instance.dates.setValue(new DateTime(data.date));
          }

          // Helper to add click-outside-ignore to widget and its children
          const markWidgetSafe = (w: HTMLElement) => {
            if (!w.classList.contains('click-outside-ignore')) {
              w.classList.add('click-outside-ignore');
              w.querySelectorAll('*').forEach(el => (el as HTMLElement).classList.add('click-outside-ignore'));
            }

            // Continuously ensure any new children are marked so overlay's click-outside logic ignores them.
            if (!(w as any)._glideOutsidePatch) {
              const ensureIgnored = (node: HTMLElement) => {
                if (!node.classList.contains('click-outside-ignore')) {
                  node.classList.add('click-outside-ignore');
                }
                node.querySelectorAll('*').forEach(el => {
                  if (!(el as HTMLElement).classList.contains('click-outside-ignore')) {
                    (el as HTMLElement).classList.add('click-outside-ignore');
                  }
                });
              };

              // Initial pass
              ensureIgnored(w);

              // Observe for dynamically created descendants (e.g., time-arrow buttons)
              const mo = new MutationObserver(muts => {
                muts.forEach(mut => {
                  mut.addedNodes.forEach(node => {
                    if (node instanceof HTMLElement) {
                      ensureIgnored(node);
                    }
                  });
                });
              });
              mo.observe(w, { childList: true, subtree: true });

              (w as any)._glideOutsidePatch = true;
              (w as any)._glideOutsideObserver = mo;
            }
          };

          // Function to find and animate the widget
          const animateWidget = (action: 'show' | 'hide') => {
            requestAnimationFrame(() => {
              let widget: HTMLElement | null = null;
              
              // Method 1: Look for the widget in the instance
              try {
                if ((instance as any).display?.widget) {
                  widget = (instance as any).display.widget;
                } else if ((instance as any).popover?.tip) {
                  widget = (instance as any).popover.tip;
                } else if ((instance as any)._widget) {
                  widget = (instance as any)._widget;
                }
              } catch (e) {
                // Silently fail
              }
              
              // Method 2: Query for the widget - prioritize body-level widgets
              if (!widget) {
                const bodyWidgets = Array.from(document.body.querySelectorAll(
                  ':scope > .tempus-dominus-widget, :scope > [class*="tempus-dominus"], :scope > .dropdown-menu[id*="tempus"]'
                )) as HTMLElement[];
                
                const allWidgets = bodyWidgets.length > 0 ? bodyWidgets : Array.from(document.querySelectorAll(
                  '.tempus-dominus-widget, .tempus-dominus-container, [class*="tempus-dominus"], .dropdown-menu[id*="tempus"]'
                )) as HTMLElement[];
                
                widget = allWidgets.find(w => {
                  const display = window.getComputedStyle(w).display;
                  return display !== 'none';
                }) || allWidgets[allWidgets.length - 1] || null;
              }
              
              if (widget) {
                markWidgetSafe(widget);
                
                // Ensure widget is in body before animating
                if (widget.parentElement !== document.body && action === 'show') {
                  document.body.appendChild(widget);
                }
                
                // Position the widget relative to the input if showing
                if (action === 'show' && inputRef.current) {
                  const inputRect = inputRef.current.getBoundingClientRect();
                  const widgetHeight = widget.offsetHeight || 300;
                  const widgetWidth = widget.offsetWidth || 300;
                  
                  // Find the cell container to get better positioning
                  let cellElement = inputRef.current.parentElement;
                  while (cellElement && !cellElement.hasAttribute('data-testid')) {
                    cellElement = cellElement.parentElement;
                  }
                  
                  const positionRect = cellElement ? cellElement.getBoundingClientRect() : inputRect;
                  
                  let top = positionRect.bottom + 2;
                  let left = positionRect.left;
                  let transformOrigin = 'top left';
                  
                  // Check if widget would go off screen bottom
                  if (top + widgetHeight > window.innerHeight - 20) {
                    top = positionRect.top - widgetHeight - 2;
                    transformOrigin = 'bottom left';
                  }
                  
                  // Check if widget would go off screen right
                  if (left + widgetWidth > window.innerWidth - 20) {
                    left = Math.max(10, window.innerWidth - widgetWidth - 20);
                    if (left < positionRect.left) {
                      left = positionRect.right - widgetWidth;
                      transformOrigin = transformOrigin.replace('left', 'right');
                    }
                  }
                  
                  // Ensure minimum distance from edges
                  top = Math.max(10, Math.min(top, window.innerHeight - widgetHeight - 10));
                  left = Math.max(10, Math.min(left, window.innerWidth - widgetWidth - 10));
                  
                  // Apply positioning
                  widget.style.position = 'fixed';
                  widget.style.top = `${top}px`;
                  widget.style.left = `${left}px`;
                  widget.style.zIndex = '999999';
                  widget.style.transformOrigin = transformOrigin;
                  widget.style.right = 'auto';
                  widget.style.bottom = 'auto';
                  widget.style.margin = '0';
                  widget.style.transform = '';
                }
                
                // Apply animations
                if (action === 'show') {
                  widget.classList.remove('tempus-dominus-widget-animated-out', 'tempus-dominus-widget-hidden');
                  widget.style.animation = 'none';
                  void widget.offsetHeight;
                  
                  widget.classList.add('tempus-dominus-widget-animated-in');
                  widget.classList.add('tempus-dominus-widget-transition');
                  
                  widget.style.opacity = '0';
                  widget.style.transform = 'translateY(-10px) scale(0.95)';
                  widget.style.transition = 'none';
                  
                  void widget.offsetHeight;
                  
                  requestAnimationFrame(() => {
                    widget.style.transition = 'opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1)';
                    widget.style.opacity = '1';
                    widget.style.transform = 'translateY(0) scale(1)';
                    widget.classList.add('tempus-dominus-widget-visible');
                  });
                } else {
                  widget.classList.remove('tempus-dominus-widget-animated-in', 'tempus-dominus-widget-visible');
                  widget.classList.add('tempus-dominus-widget-animated-out');
                  widget.classList.add('tempus-dominus-widget-transition');
                  widget.classList.add('tempus-dominus-widget-hidden');
                  
                  widget.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 1, 1), transform 200ms cubic-bezier(0.4, 0, 1, 1)';
                  widget.style.opacity = '0';
                  widget.style.transform = 'translateY(-10px) scale(0.95)';
                }
              }
            });
          };

          // Handle show event for animations
          const handleShow = (e: any) => {
            setTimeout(() => {
              const widgets = document.querySelectorAll('.tempus-dominus-widget, [class*="tempus-dominus"]');
              let movedWidget = false;
              widgets.forEach((widget) => {
                if (widget.parentElement !== document.body && window.getComputedStyle(widget).display !== 'none') {
                  document.body.appendChild(widget);
                  movedWidget = true;
                }
              });
              
              if (movedWidget) {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    animateWidget('show');
                  });
                });
              } else {
                animateWidget('show');
              }
            }, 0);
            
            setTimeout(() => animateWidget('show'), 50);
          };

          // Subscribe to date change events
          const handleDateChange = (e: any) => {
            if (e.date) {
              const jsDate = new Date(e.date.valueOf());
              const newCell = {
                ...props.value,
                data: {
                  ...data,
                  date: jsDate,
                  displayDate: formatDisplayDate(jsDate, data.format),
                },
              } as typeof props.value;
              props.onChange(newCell);
            } else if (e.isClear) {
              const cleared = {
                ...props.value,
                data: { ...data, date: undefined, displayDate: "" },
              } as typeof props.value;
              props.onChange(cleared);
            }
          };

          // Subscribe to hide event - this fires when picker closes
          const handleHide = (e: any) => {
            if (data.format === "time" && e && typeof e.preventDefault === "function") {
              e.preventDefault();
              return;
            }
            
            animateWidget('hide');
            
            const selectedDates = instance.dates.picked;
            if (selectedDates && selectedDates.length > 0) {
              const selectedDateTime = selectedDates[0];
              const jsDate = new Date(selectedDateTime.valueOf());
              
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

          // Subscribe to events
          const showSubscription = instance.subscribe(Namespace.events.show, handleShow);
          const changeSubscription = instance.subscribe(Namespace.events.change, handleDateChange);
          const hideSubscription = instance.subscribe(Namespace.events.hide, handleHide);
          
          // Try to detect widget creation using MutationObserver
          const widgetObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement) {
                  const isWidget = node.classList.contains('tempus-dominus-widget') ||
                                 node.classList.contains('dropdown-menu') ||
                                 node.querySelector('.tempus-dominus-widget') ||
                                 (node.id && node.id.includes('tempus'));
                  
                  if (isWidget) {
                    markWidgetSafe(node as HTMLElement);
                    
                    // Position the widget immediately
                    if (inputRef.current) {
                      const widget = node.classList.contains('tempus-dominus-widget') ? node : 
                                   node.querySelector('.tempus-dominus-widget') as HTMLElement || node;
                      
                      const inputRect = inputRef.current.getBoundingClientRect();
                      const widgetHeight = widget.offsetHeight || 300;
                      const widgetWidth = widget.offsetWidth || 300;
                      
                      let top = inputRect.bottom + 5;
                      let left = inputRect.left;
                      let transformOrigin = 'top left';
                      
                      if (top + widgetHeight > window.innerHeight) {
                        top = inputRect.top - widgetHeight - 5;
                        transformOrigin = 'bottom left';
                      }
                      
                      if (left + widgetWidth > window.innerWidth) {
                        left = Math.max(0, window.innerWidth - widgetWidth - 10);
                        transformOrigin = transformOrigin.replace('left', 'right');
                      }
                      
                      widget.style.position = 'fixed';
                      widget.style.top = `${top}px`;
                      widget.style.left = `${left}px`;
                      widget.style.zIndex = '999999';
                      widget.style.transformOrigin = transformOrigin;
                      widget.style.right = 'auto';
                      widget.style.bottom = 'auto';
                      widget.style.margin = '0';
                    }
                    
                    setTimeout(() => animateWidget('show'), 10);
                    break;
                  }
                }
              }
            }
          });
          
          // Observe the entire document for widget creation
          widgetObserver.observe(document.body, {
            childList: true,
            subtree: true
          });

          // Listen for input changes directly on the input field
          const handleInputChange = () => {
            const inputValue = inputRef.current?.value;
            if (inputValue) {
              try {
                const parsedDate = new Date(inputValue);
                if (!isNaN(parsedDate.getTime())) {
                  const newCell = {
                    ...props.value,
                    data: {
                      ...data,
                      date: parsedDate,
                      displayDate: formatDisplayDate(parsedDate, data.format),
                    },
                  } as typeof props.value;
                  props.onChange(newCell);
                }
              } catch (error) {
                // Silently fail
              }
            }
          };
          
          // Listen for input events on the input field
          inputRef.current?.addEventListener('input', handleInputChange);
          inputRef.current?.addEventListener('change', handleInputChange);
          
          // Store subscriptions for cleanup
          (instance as any)._showSubscription = showSubscription;
          (instance as any)._changeSubscription = changeSubscription;
          (instance as any)._hideSubscription = hideSubscription;
          (instance as any)._inputHandler = handleInputChange;
          (instance as any)._widgetObserver = widgetObserver;
         
          // Show the widget after initialization
          setTimeout(() => {
            instance.show();
          }, 100);

        } catch (error) {
          console.warn("Tempus Dominus failed to load, falling back to native input:", error);
        }
      }, [tempusInstance]);

      // Cleanup effect
      React.useEffect(() => {
        return () => {
          if (tempusInstance) {
            try {
              // Disconnect observers
              if ((tempusInstance as any)._widgetObserver) {
                (tempusInstance as any)._widgetObserver.disconnect();
              }
              // Unsubscribe from events
              if ((tempusInstance as any)._showSubscription) {
                (tempusInstance as any)._showSubscription.unsubscribe();
              }
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
              // Dispose the instance
              tempusInstance.dispose();
            } catch (error) {
              console.error("Failed to dispose Tempus Dominus:", error);
            }
          }
        };
      }, [tempusInstance]);

      const formatDisplayDate = (date: Date, format?: string): string => {
        if (!date) return "";
        
        switch (format) {
          case "time":
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          case "datetime":
            return date.toLocaleString();
          case "date":
          default:
            return date.toLocaleDateString('en-GB');
        }
      };

      const getInputType = () => {
        switch (data.format) {
          case "time": return "time";
          case "datetime": return "datetime-local";
          case "date":
          default: return "text";
        }
      };

      const getInputValue = () => {
        if (!data.date) return "";
        
        switch (data.format) {
          case "time":
            return data.date.toTimeString().slice(0, 5);
          case "datetime":
            return toLocalDateTimeInputValue(data.date);
          case "date":
          default:
            return toLocalDateInputValue(data.date);
        }
      };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let newDate: Date | undefined;

        if (value) {
          if (data.format === "time") {
            const today = new Date();
            const [hours, minutes] = value.split(":").map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
              newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
            }
          } else if (data.format === "date") {
            const parts = value.split("/").map(Number);
            if (parts.length === 3) {
              const [day, month, year] = parts;
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                newDate = new Date(year, month - 1, day);
              }
            }
          } else {
            newDate = new Date(value);
            if (isNaN(newDate.getTime())) {
              newDate = undefined;
            }
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
      };

      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const next = e.relatedTarget as HTMLElement | null;
        const widgetOpen = !!document.querySelector('.tempus-dominus-widget.tempus-dominus-widget-visible');
        if (widgetOpen || (next && (wrapperRef.current?.contains(next) || next.closest('.tempus-dominus-widget')))) {
          return;
        }

        const inputValue = e.currentTarget.value;
        if (inputValue) {
          handleChange({ target: { value: inputValue } } as React.ChangeEvent<HTMLInputElement>);
        }
        onFinishedEditing?.(props.value);
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          const inputValue = inputRef.current?.value;
          if (inputValue) {
            handleChange({ target: { value: inputValue } } as React.ChangeEvent<HTMLInputElement>);
          }
          onFinishedEditing?.(props.value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          if (inputRef.current && data.date) {
            inputRef.current.value = getInputValue();
          }
          onFinishedEditing?.(props.value);
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
            defaultValue={getInputValue()}
            min={getMinValue()}
            max={getMaxValue()}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={data.readonly}
            placeholder={data.format === "date" ? "dd/mm/yyyy" : data.format === "time" ? "hh:mm" : ""}
          />
          <button
            ref={iconButtonRef}
            style={{
              ...iconButtonStyle,
              opacity: data.readonly ? 0.3 : 0.7,
            }}
            onClick={handleIconClick}
            disabled={data.readonly}
            onMouseEnter={(e) => {
              if (!data.readonly) {
                e.currentTarget.style.opacity = "1";
              }
            }}
            onMouseLeave={(e) => {
              if (!data.readonly) {
                e.currentTarget.style.opacity = "0.7";
              }
            }}
          >
            {data.format === "time" ? (
              // Clock icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ pointerEvents: 'none' }}>
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8 3a.5.5 0 0 1 .5.5V8a.5.5 0 0 1-.146.354l-2.5 2.5a.5.5 0 0 1-.708-.708L7.293 8H3.5a.5.5 0 0 1 0-1H8V3.5A.5.5 0 0 1 8 3Z"/>
              </svg>
            ) : (
              // Calendar icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ pointerEvents: 'none' }}>
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                <path d="M3 8.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-6 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
              </svg>
            )}
          </button>
        </div>
      );
    },
    disablePadding: true
  }),

  onPaste: (v, d) => {
    let parsedDate: Date | undefined;
    
    if (v) {
      const timestamp = Number(v);
      if (!isNaN(timestamp)) {
        parsedDate = new Date(timestamp);
      } else {
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
          return date.toLocaleDateString('en-GB');
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