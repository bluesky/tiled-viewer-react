import React, { useCallback, useMemo, useState } from 'react';
import { lightTheme, darkTheme, XYChartTheme } from '@visx/xychart';
import { PatternLines } from '@visx/pattern';
import { GlyphProps } from '@visx/xychart/lib/types';
import { AnimationTrajectory } from '@visx/react-spring/lib/types';
import { GlyphCross, GlyphDot, GlyphStar } from '@visx/glyph';
import { curveLinear, curveStep, curveCardinal } from '@visx/curve';
import { RenderTooltipGlyphProps } from '@visx/xychart/lib/components/Tooltip';
import customTheme from './customTheme';
import userPrefersReducedMotion from './userPrefersReducedMotion';
import getAnimatedOrUnanimatedComponents from './getAnimatedOrUnanimatedComponents';
import PlotSettingsRow from './PlotSettingsRow';

import './Controls.css';

const linearScaleConfig = { type: 'linear' } as const;
const numTicks = 4;
const selectedDatumPatternId = 'xychart-selected-datum';

type DataPoint = Record<string, number>;
type Accessor = (d: DataPoint, index?: number) => number | string;

type SimpleScaleConfig = { type: 'band' | 'linear'; paddingInner?: number };

type ProvidedProps = {
  accessors: {
    x: Record<string, Accessor>;
    y: Record<string, Accessor>;
  };
  animationTrajectory?: AnimationTrajectory;
  annotationDataKey: string | null;
  annotationDatum?: DataPoint;
  annotationLabelPosition: { dx: number; dy: number };
  annotationType?: 'line' | 'circle';
  colorAccessorFactory: (key: string) => (d: DataPoint) => string | null;
  config: {
    x: SimpleScaleConfig;
    y: SimpleScaleConfig;
  };
  curve: typeof curveLinear | typeof curveCardinal | typeof curveStep;
  data: DataPoint[];
  editAnnotationLabelPosition: boolean;
  numTicks: number;
  setAnnotationDataIndex: (index: number) => void;
  setAnnotationDataKey: (key: string | null) => void;
  setAnnotationLabelPosition: (position: { dx: number; dy: number }) => void;
  renderAreaSeries: boolean;
  renderAreaStack: boolean;
  renderBarGroup: boolean;
  renderBarSeries: boolean;
  renderBarStack: boolean;
  renderGlyph: React.FC<GlyphProps<DataPoint>>;
  renderGlyphSeries: boolean;
  enableTooltipGlyph: boolean;
  renderTooltipGlyph: React.FC<RenderTooltipGlyphProps<DataPoint>>;
  renderHorizontally: boolean;
  renderLineSeries: boolean;
  sharedTooltip: boolean;
  showGridColumns: boolean;
  showGridRows: boolean;
  showHorizontalCrosshair: boolean;
  showTooltip: boolean;
  showVerticalCrosshair: boolean;
  snapTooltipToDatumX: boolean;
  snapTooltipToDatumY: boolean;
  stackOffset?: 'wiggle' | 'expand' | 'diverging' | 'silhouette';
  theme: XYChartTheme;
  xAxisOrientation: 'top' | 'bottom';
  yAxisOrientation: 'left' | 'right';
  dataKeys: string[];
} & ReturnType<typeof getAnimatedOrUnanimatedComponents>;

type ControlsProps = {
  children: (props: ProvidedProps) => React.ReactNode;
  data: DataPoint[];
  dataKeys: string[];
  setSelectedDataKeys: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function ExampleControls({ children, data, dataKeys, setSelectedDataKeys }: ControlsProps) {
  const [useAnimatedComponents, setUseAnimatedComponents] = useState(!userPrefersReducedMotion());
  const [theme, setTheme] = useState<XYChartTheme>(lightTheme);
  const [animationTrajectory, setAnimationTrajectory] = useState<AnimationTrajectory | undefined>('center');
  const [gridProps, setGridProps] = useState<[boolean, boolean]>([false, false]);
  const [showGridRows, showGridColumns] = gridProps;
  const [xAxisOrientation, setXAxisOrientation] = useState<'top' | 'bottom'>('bottom');
  const [yAxisOrientation, setYAxisOrientation] = useState<'left' | 'right'>('left');
  const [renderHorizontally, setRenderHorizontally] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [annotationDataKey, setAnnotationDataKey] = useState<string | null>(null);
  const [annotationType, setAnnotationType] = useState<'line' | 'circle'>('circle');
  const [showVerticalCrosshair, setShowVerticalCrosshair] = useState(true);
  const [showHorizontalCrosshair, setShowHorizontalCrosshair] = useState(false);
  const [snapTooltipToDatumX, setSnapTooltipToDatumX] = useState(true);
  const [snapTooltipToDatumY, setSnapTooltipToDatumY] = useState(true);
  const [sharedTooltip, setSharedTooltip] = useState(true);
  const [renderBarStackOrGroup, setRenderBarStackOrGroup] = useState<'bar' | 'barstack' | 'bargroup' | 'none'>('none');
  const [renderAreaLineOrStack, setRenderAreaLineOrStack] = useState<'line' | 'area' | 'areastack' | 'none'>('line');
  const [stackOffset, setStackOffset] = useState<'wiggle' | 'expand' | 'diverging' | 'silhouette' | undefined>();
  const [renderGlyphSeries, setRenderGlyphSeries] = useState(false);
  const [editAnnotationLabelPosition, setEditAnnotationLabelPosition] = useState(false);
  const [annotationLabelPosition, setAnnotationLabelPosition] = useState({ dx: -40, dy: -20 });
  const [annotationDataIndex, setAnnotationDataIndex] = useState(0);
  const [glyphComponent, setGlyphComponent] = useState<'star' | 'cross' | 'circle' | '🍍'>('star');
  const [curveType, setCurveType] = useState<'linear' | 'cardinal' | 'step'>('linear');
  const [enableTooltipGlyph, setEnableTooltipGlyph] = useState(false);
  const [tooltipGlyphComponent, setTooltipGlyphComponent] = useState<'star' | 'cross' | 'circle' | '🍍'>('star');

  const allowableDataKeys = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(key => key !== '__index');
  }, [data]);

  const glyphOutline = theme.gridStyles.stroke;

  const renderGlyph = useCallback(
    ({ x, y, size, color, onPointerMove, onPointerOut, onPointerUp }: GlyphProps<DataPoint>) => {
      const handlers = { onPointerMove, onPointerOut, onPointerUp };
      if (glyphComponent === 'star') {
        return <GlyphStar left={x} top={y} stroke={glyphOutline} fill={color} size={size * 10} {...handlers} />;
      }
      if (glyphComponent === 'circle') {
        return <GlyphDot left={x} top={y} stroke={glyphOutline} fill={color} r={size / 2} {...handlers} />;
      }
      if (glyphComponent === 'cross') {
        return <GlyphCross left={x} top={y} stroke={glyphOutline} fill={color} size={size * 10} {...handlers} />;
      }
      return (
        <text x={x} y={y} dx="-0.75em" dy="0.25em" fontSize={14} {...handlers}>
          🍍
        </text>
      );
    },
    [glyphComponent, glyphOutline],
  );

  const renderTooltipGlyph = useCallback(
    ({ x, y, size, color, onPointerMove, onPointerOut, onPointerUp, isNearestDatum }: RenderTooltipGlyphProps<DataPoint>) => {
      const handlers = { onPointerMove, onPointerOut, onPointerUp };
      if (tooltipGlyphComponent === 'star') {
        return <GlyphStar left={x} top={y} stroke={glyphOutline} fill={color} size={size * 10} {...handlers} />;
      }
      if (tooltipGlyphComponent === 'circle') {
        return <GlyphDot left={x} top={y} stroke={glyphOutline} fill={color} r={size} {...handlers} />;
      }
      if (tooltipGlyphComponent === 'cross') {
        return <GlyphCross left={x} top={y} stroke={glyphOutline} fill={color} size={size * 10} {...handlers} />;
      }
      return (
        <text x={x} y={y} dx="-0.75em" dy="0.25em" fontSize={14} {...handlers}>
          {isNearestDatum ? '🍍' : '🍌'}
        </text>
      );
    },
    [tooltipGlyphComponent, glyphOutline],
  );

  const colorAccessorFactory = useCallback(
    (dataKey: string) => (d: DataPoint) =>
      annotationDataKey === dataKey && d === data[annotationDataIndex] ? `url(#${selectedDatumPatternId})` : null,
    [annotationDataIndex, annotationDataKey, data],
  );

  const accessors = useMemo(() => {
    const xAccessors: Record<string, Accessor> = {};
    const yAccessors: Record<string, Accessor> = {};

    dataKeys.forEach(key => {
      // X-axis always uses array index
      xAccessors[key] = (d, index = 0) => d?.__index || index;
      // Y-axis uses the actual data value for that key
      yAccessors[key] = (d) => Number(d[key]) || 0;
    });

    return {
      x: xAccessors,
      y: yAccessors,
    };
  }, [dataKeys]);

  const config = useMemo(
    () => ({
      x: linearScaleConfig,
      y: linearScaleConfig,
    }),
    [],
  );

  const canSnapTooltipToDatum = renderBarStackOrGroup !== 'barstack' && renderAreaLineOrStack !== 'areastack';
console.log({data})
  return (
    <>
      {children({
        accessors,
        animationTrajectory,
        annotationDataKey,
        annotationDatum: data[annotationDataIndex],
        annotationLabelPosition,
        annotationType,
        colorAccessorFactory,
        config,
        curve:
          (curveType === 'cardinal' && curveCardinal) ||
          (curveType === 'step' && curveStep) ||
          curveLinear,
        data,
        editAnnotationLabelPosition,
        numTicks,
        renderBarGroup: renderBarStackOrGroup === 'bargroup',
        renderBarSeries: renderBarStackOrGroup === 'bar',
        renderBarStack: renderBarStackOrGroup === 'barstack',
        renderGlyphSeries,
        renderGlyph,
        enableTooltipGlyph,
        renderTooltipGlyph,
        renderHorizontally,
        renderAreaSeries: renderAreaLineOrStack === 'area',
        renderAreaStack: renderAreaLineOrStack === 'areastack',
        renderLineSeries: renderAreaLineOrStack === 'line',
        setAnnotationDataIndex,
        setAnnotationDataKey,
        setAnnotationLabelPosition,
        sharedTooltip,
        showGridColumns,
        showGridRows,
        showHorizontalCrosshair,
        showTooltip,
        showVerticalCrosshair,
        snapTooltipToDatumX: canSnapTooltipToDatum && snapTooltipToDatumX,
        snapTooltipToDatumY: canSnapTooltipToDatum && snapTooltipToDatumY,
        stackOffset,
        theme,
        xAxisOrientation,
        yAxisOrientation,
        dataKeys,
        ...getAnimatedOrUnanimatedComponents(useAnimatedComponents),
      })}
      <svg className="pattern-lines">
        <PatternLines
          id={selectedDatumPatternId}
          width={6}
          height={6}
          orientation={['diagonalRightToLeft']}
          stroke={theme?.axisStyles.x.bottom.axisLine.stroke}
          strokeWidth={1.5}
        />
      </svg>

      <div className="w-full flex flex-wrap border justify-center gap-12 border-blue-500">
        <div className="min-w-[200px] border border-red-500 flex ">
            {/* User input for the selectedData keys, user can select multiple */}
            <div>
              <p>Select Y Axis</p>
              <select multiple value={dataKeys} onChange={(e) => {
                const options = Array.from(e.target.options);
                const selected = options.filter(option => option.selected).map(option => option.value);
                setSelectedDataKeys(selected);
              }}>
                {allowableDataKeys.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
        </div>
            <div className="controls">
          {/* Theme */}
          <div>
            <strong>theme</strong>
            <label>
              <input type="radio" onChange={() => setTheme(lightTheme)} checked={theme === lightTheme} />
              light
            </label>
            <label>
              <input type="radio" onChange={() => setTheme(darkTheme)} checked={theme === darkTheme} />
              dark
            </label>
            <label>
              <input type="radio" onChange={() => setTheme(customTheme)} checked={theme === customTheme} />
              custom
            </label>
          </div>

          {/* Series */}
          <div>
            <strong>line series</strong>
            <label>
              <input
                type="radio"
                onChange={() => {
                  if (renderBarStackOrGroup === 'barstack' || renderBarStackOrGroup === 'bargroup') {
                    setRenderBarStackOrGroup('none');
                  }
                  setRenderAreaLineOrStack('line');
                }}
                checked={renderAreaLineOrStack === 'line'}
              />
              line
            </label>
            <label>
              <input
                type="radio"
                onChange={() => {
                  if (renderBarStackOrGroup === 'barstack' || renderBarStackOrGroup === 'bargroup') {
                    setRenderBarStackOrGroup('none');
                  }
                  setRenderAreaLineOrStack('area');
                }}
                checked={renderAreaLineOrStack === 'area'}
              />
              area
            </label>
            <label>
              <input
                type="radio"
                onChange={() => {
                  setRenderBarStackOrGroup('none');
                  setRenderAreaLineOrStack('areastack');
                }}
                checked={renderAreaLineOrStack === 'areastack'}
              />
              area stack
            </label>
            <label>
              <input
                type="radio"
                onChange={() => setRenderAreaLineOrStack('none')}
                checked={renderAreaLineOrStack === 'none'}
              />
              none
            </label>
            &nbsp;&nbsp;&nbsp;&nbsp;
          </div>

          {/* Curve */}
          <div>
            <strong>curve shape</strong>
            <label>
              <input
                type="radio"
                disabled={renderAreaLineOrStack === 'none'}
                onChange={() => setCurveType('linear')}
                checked={curveType === 'linear'}
              />
              linear
            </label>
            <label>
              <input
                type="radio"
                disabled={renderAreaLineOrStack === 'none'}
                onChange={() => setCurveType('cardinal')}
                checked={curveType === 'cardinal'}
              />
              cardinal (smooth)
            </label>
            <label>
              <input
                type="radio"
                disabled={renderAreaLineOrStack === 'none'}
                onChange={() => setCurveType('step')}
                checked={curveType === 'step'}
              />
              step
            </label>
          </div>

          {/* Glyph */}
          <div>
            <strong>glyph series</strong>
            <label>
              <input
                type="checkbox"
                onChange={() => setRenderGlyphSeries(!renderGlyphSeries)}
                checked={renderGlyphSeries}
              />
              render glyphs
            </label>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <label>
              <input
                type="radio"
                disabled={!renderGlyphSeries}
                onChange={() => setGlyphComponent('circle')}
                checked={glyphComponent === 'circle'}
              />
              circle
            </label>
            <label>
              <input
                type="radio"
                disabled={!renderGlyphSeries}
                onChange={() => setGlyphComponent('star')}
                checked={glyphComponent === 'star'}
              />
              star
            </label>
            <label>
              <input
                type="radio"
                disabled={!renderGlyphSeries}
                onChange={() => setGlyphComponent('cross')}
                checked={glyphComponent === 'cross'}
              />
              cross
            </label>
            <label>
              <input
                type="radio"
                disabled={!renderGlyphSeries}
                onChange={() => setGlyphComponent('🍍')}
                checked={glyphComponent === '🍍'}
              />
              🍍
            </label>
          </div>

          {/* Tooltip */}
          <div>
            <strong>tooltip</strong>
            <label>
              <input type="checkbox" onChange={() => setShowTooltip(!showTooltip)} checked={showTooltip} />
              show tooltip
            </label>
            <label>
              <input
                type="checkbox"
                disabled={!showTooltip}
                onChange={() => setShowVerticalCrosshair(!showVerticalCrosshair)}
                checked={showTooltip && showVerticalCrosshair}
              />
              vertical crosshair
            </label>
            <label>
              <input
                type="checkbox"
                disabled={!showTooltip}
                onChange={() => setShowHorizontalCrosshair(!showHorizontalCrosshair)}
                checked={showTooltip && showHorizontalCrosshair}
              />
              horizontal crosshair
            </label>
          </div>

          {/* Grid */}
          <div>
            <strong>grid</strong>
            <label>
              <input type="radio" onChange={() => setGridProps([true, false])} checked={showGridRows && !showGridColumns} />
              rows
            </label>
            <label>
              <input type="radio" onChange={() => setGridProps([false, true])} checked={!showGridRows && showGridColumns} />
              columns
            </label>
            <label>
              <input type="radio" onChange={() => setGridProps([true, true])} checked={showGridRows && showGridColumns} />
              both
            </label>
            <label>
              <input type="radio" onChange={() => setGridProps([false, false])} checked={!showGridRows && !showGridColumns} />
              none
            </label>
          </div>

          {/* Animation */}
          <div>
            <label>
              <input type="checkbox" onChange={() => setUseAnimatedComponents(!useAnimatedComponents)} checked={useAnimatedComponents} />
              use animated components
            </label>
          </div>
        </div>
      </div>
    </>
  );
}