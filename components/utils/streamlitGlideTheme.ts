import { transparentize } from "color2k";
import { Theme } from "@glideapps/glide-data-grid";
import { shadcn } from "../theme/shadcn";

/**
 * Converts shadcn color tokens into a Glide-Data-Grid Theme.
 * Supported mode: "light" | "dark".
 */
export function createGlideTheme(mode: "light" | "dark"): Partial<Theme> {
  const isDark = mode === "dark";
  const themeColors = isDark ? shadcn.dark : shadcn.light;

  return {
    accentColor: "#2580f0",
    accentLight: transparentize("#2580f0", 0.8),
    textDark: themeColors.foreground,
    textMedium: themeColors.mutedForeground,
    textLight: themeColors.mutedForeground,
    textHeader: themeColors.foreground,
    textHeaderSelected: themeColors.foreground,
    bgCell: themeColors.background,
    bgCellMedium: (themeColors as any).hover,
    bgHeader: themeColors.secondary,
    bgHeaderHasFocus: themeColors.secondary,
    bgHeaderHovered: themeColors.accent,
    bgBubble: themeColors.popover,
    bgBubbleSelected: themeColors.primary,
    bgSearchResult: transparentize(themeColors.primary, 0.8),
    borderColor: themeColors.border,
    drilldownBorder: themeColors.border,
    linkColor: themeColors.primary,
    cellHorizontalPadding: 2,
    cellVerticalPadding: 3,
    headerIconSize: 18,
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    baseFontStyle: "0.8125rem",
    headerFontStyle: "600 0.8125rem", 
    editorFontSize: "0.8125rem",
  };
} 