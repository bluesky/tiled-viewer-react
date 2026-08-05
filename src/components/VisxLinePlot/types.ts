import type { ReactNode, SVGProps } from 'react';
import type { GlyphProps } from '@visx/xychart';

/**
 * Local mirror of @visx/xychart's RenderTooltipGlyphProps, which is not exported
 * from the package root. Declared here so we avoid deep (`lib/...`) imports.
 */
export interface RenderTooltipGlyphProps<Datum extends object> extends GlyphProps<Datum> {
  glyphStyle?: SVGProps<SVGCircleElement>;
  isNearestDatum: boolean;
}

/**
 * Render-prop signatures used by visx for glyphs. Written as plain function types
 * (rather than React.FC) so they are identical under React 18 and 19 typings.
 */
export type GlyphRenderer<Datum extends object> = (props: GlyphProps<Datum>) => ReactNode;

export type TooltipGlyphRenderer<Datum extends object> = (
  props: RenderTooltipGlyphProps<Datum>,
) => ReactNode;
