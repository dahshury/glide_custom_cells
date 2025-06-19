export class PhoneInputService {
  private static readonly DEBOUNCE_DELAY = 50;
  private static readonly COUNTRY_CHANGE_DELAY = 0;
  
  static getDebounceDelay(): number {
    return this.DEBOUNCE_DELAY;
  }
  
  static getCountryChangeDelay(): number {
    return this.COUNTRY_CHANGE_DELAY;
  }
  
  static getPopoverAnimationConfig() {
    return {
      duration: 200,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      willChange: "transform, opacity"
    };
  }
  
  static getCommandPaletteConfig() {
    return {
      maxHeight: 300,
      scrollBehavior: "smooth" as const,
      overscrollBehavior: "contain" as const
    };
  }
  
  static getEditorStyles(isDarkTheme: boolean) {
    return {
      wrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        position: "relative" as const,
        backgroundColor: isDarkTheme ? "#1e1e1e" : "#ffffff",
        boxSizing: "border-box" as const,
        padding: "0 8px",
        overflow: "hidden"
      },
      inner: {
        width: "100%",
        height: "28px",
        display: "flex",
        alignItems: "center",
        fontSize: "13px",
        fontFamily: "inherit",
        backgroundColor: "transparent",
        color: "inherit",
        marginTop: "-2px"
      }
    };
  }
  
  static getPerformanceConfig() {
    return {
      useRequestAnimationFrame: true,
      enableDebouncing: true,
      memoizeComponents: true,
      optimizeDOMQueries: true
    };
  }
} 