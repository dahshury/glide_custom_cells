import { Rectangle, Theme, BaseDrawArgs, drawTextCell } from "@glideapps/glide-data-grid";

export const NULL_VALUE_TOKEN = "None";

/**
 * Draw a red indicator in the top right corner of the cell
 * to indicate an issue with the cell (e.g. required or error).
 */
export function drawAttentionIndicator(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  theme: Theme
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.width - 8, rect.y + 1);
  ctx.lineTo(rect.x + rect.width, rect.y + 1);
  ctx.lineTo(rect.x + rect.width, rect.y + 9);
  ctx.fillStyle = theme.accentColor;
  ctx.fill();
  ctx.restore();
}

/**
 * If a cell is marked as missing, we draw a placeholder symbol with a faded text color.
 */
export const drawMissingPlaceholder = (args: BaseDrawArgs): void => {
  const { cell, theme, ctx } = args;
  drawTextCell(
    {
      ...args,
      theme: {
        ...theme,
        textDark: theme.textLight,
        headerFontFull: `${theme.headerFontStyle} ${theme.fontFamily}`,
        baseFontFull: `${theme.baseFontStyle} ${theme.fontFamily}`,
        markerFontFull: `${theme.markerFontStyle} ${theme.fontFamily}`,
      },
      // The following props are just added for technical reasons:
      // @ts-expect-error
      spriteManager: {},
      hyperWrapping: false,
    },
    NULL_VALUE_TOKEN,
    (cell as any).contentAlign
  );
  ctx.fillStyle = theme.textDark;
}; 