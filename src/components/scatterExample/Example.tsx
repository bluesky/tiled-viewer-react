import React from 'react';
import { useMemo } from 'react';
import ExampleControls from './ExampleControls';
import CustomChartBackground from './CustomChartBackground';

export type XYChartProps = {
  width: number;
  height: number;
  sampleData: Record<string, number>[];
  dataKeys: string[];
};

export default function Example({ height, sampleData }: XYChartProps) {
      // Get data keys dynamically
    const dataKeys = useMemo(() => {
      if (!sampleData || sampleData.length === 0) return [];
      return Object.keys(sampleData[0]).filter(key => key !== '__index');
    }, [sampleData]);

    const [ selectedDataKeys, setSelectedDataKeys ] = React.useState<string[]>([]);


  return (
    <>


    <ExampleControls data={sampleData} dataKeys={selectedDataKeys} setSelectedDataKeys={setSelectedDataKeys}>
      {({
        accessors,
        animationTrajectory,
        annotationDataKey,
        annotationDatum,
        annotationLabelPosition,
        annotationType,
        colorAccessorFactory,
        config,
        curve,
        data,
        editAnnotationLabelPosition,
        numTicks,
        renderAreaSeries,
        renderAreaStack,
        renderBarGroup,
        renderBarSeries,
        renderBarStack,
        renderGlyph,
        renderGlyphSeries,
        enableTooltipGlyph,
        renderTooltipGlyph,
        renderHorizontally,
        renderLineSeries,
        setAnnotationDataIndex,
        setAnnotationDataKey,
        setAnnotationLabelPosition,
        sharedTooltip,
        showGridColumns,
        showGridRows,
        showHorizontalCrosshair,
        showTooltip,
        showVerticalCrosshair,
        snapTooltipToDatumX,
        snapTooltipToDatumY,
        stackOffset,
        theme,
        xAxisOrientation,
        yAxisOrientation,
        dataKeys,
        Annotation,
        AreaSeries,
        AreaStack,
        Axis,
        BarGroup,
        BarSeries,
        BarStack,
        GlyphSeries,
        Grid,
        LineSeries,
        AnnotationCircleSubject,
        AnnotationConnector,
        AnnotationLabel,
        AnnotationLineSubject,
        Tooltip,
        XYChart,
      }) => (
        <XYChart
          theme={theme}
          xScale={config.x}
          yScale={config.y}
          height={Math.min(400, height)}
          captureEvents={!editAnnotationLabelPosition}
          onPointerUp={(d) => {
            if (dataKeys.includes(d.key)) {
              setAnnotationDataKey(d.key);
              setAnnotationDataIndex(d.index);
            }
          }}
        >
          <CustomChartBackground />
          <Grid
            key={`grid-${animationTrajectory}`}
            rows={showGridRows}
            columns={showGridColumns}
            animationTrajectory={animationTrajectory}
            numTicks={numTicks}
          />
          
          {renderLineSeries && (
            <>
              {dataKeys.map((key) => (
                <LineSeries
                  key={key}
                  dataKey={key}
                  data={data}
                  xAccessor={accessors.x[key]}
                  yAccessor={accessors.y[key]}
                  curve={curve}
                />
              ))}
            </>
          )}

          {renderAreaSeries && (
            <>
              {dataKeys.map((key) => (
                <AreaSeries
                  key={key}
                  dataKey={key}
                  data={data}
                  xAccessor={accessors.x[key]}
                  yAccessor={accessors.y[key]}
                  curve={curve}
                  fillOpacity={0.4}

                />
              ))}
            </>
          )}

          {renderAreaStack && (
            <AreaStack offset={stackOffset}>
              {dataKeys.map((key) => (
                <AreaSeries
                  key={key}
                  dataKey={key}
                  data={data}
                  xAccessor={accessors.x[key]}
                  yAccessor={accessors.y[key]}
                  curve={curve}
                />
              ))}
            </AreaStack>
          )}

          {renderGlyphSeries && (
            <>
              {dataKeys.map((key) => (
                <GlyphSeries
                  key={key}
                  dataKey={key}
                  data={data}
                  xAccessor={accessors.x[key]}
                  yAccessor={accessors.y[key]}
                  renderGlyph={renderGlyph}
                  colorAccessor={colorAccessorFactory(key)}
                />
              ))}
            </>
          )}

          <Axis
            key={`x-axis-${animationTrajectory}-${renderHorizontally}`}
            orientation={renderHorizontally ? yAxisOrientation : xAxisOrientation}
            numTicks={numTicks}
            animationTrajectory={animationTrajectory}
            label="Index"
          />
          <Axis
            key={`y-axis-${animationTrajectory}-${renderHorizontally}`}
            label="Value"
            orientation={renderHorizontally ? xAxisOrientation : yAxisOrientation}
            numTicks={numTicks}
            animationTrajectory={animationTrajectory}
          />

          {annotationDataKey && annotationDatum && dataKeys.includes(annotationDataKey) && (
            <Annotation
              dataKey={annotationDataKey}
              datum={annotationDatum}
              dx={annotationLabelPosition.dx}
              dy={annotationLabelPosition.dy}
              editable={editAnnotationLabelPosition}
              canEditSubject={false}
              onDragEnd={({ dx, dy }) => setAnnotationLabelPosition({ dx, dy })}
            >
              <AnnotationConnector />
              {annotationType === 'circle' ? (
                <AnnotationCircleSubject />
              ) : (
                <AnnotationLineSubject />
              )}
              <AnnotationLabel
                title={annotationDataKey}
                subtitle={`Index: ${data.indexOf(annotationDatum)}, Value: ${annotationDatum[annotationDataKey]}`}
                width={135}
                backgroundProps={{
                  stroke: theme.gridStyles.stroke,
                  strokeOpacity: 0.5,
                  fillOpacity: 0.8,
                }}
              />
            </Annotation>
          )}

          {showTooltip && (
            <Tooltip
              showHorizontalCrosshair={showHorizontalCrosshair}
              showVerticalCrosshair={showVerticalCrosshair}
              snapTooltipToDatumX={snapTooltipToDatumX}
              snapTooltipToDatumY={snapTooltipToDatumY}
              showDatumGlyph={(snapTooltipToDatumX || snapTooltipToDatumY) && !renderBarGroup}
              showSeriesGlyphs={sharedTooltip && !renderBarGroup}
              renderGlyph={enableTooltipGlyph ? renderTooltipGlyph : undefined}
              renderTooltip={({ tooltipData, colorScale }) => {
                const nearestDatum = tooltipData?.nearestDatum;
                if (!nearestDatum) return null;

                const index = data.indexOf(nearestDatum.datum);
                const keysToShow = sharedTooltip 
                  ? Object.keys(tooltipData?.datumByKey ?? {}).filter(key => dataKeys.includes(key))
                  : [nearestDatum.key].filter(key => key && dataKeys.includes(key));

                return (
                  <div style={{ padding: '8px', background: 'white', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <div><strong>Index:</strong> {index}</div>
                    <br />
                    {keysToShow.map((key) => {
                      const value = nearestDatum.datum[key];
                      return (
                        <div key={key}>
                          <span
                            style={{
                              color: colorScale?.(key),
                              fontWeight: nearestDatum.key === key ? 'bold' : 'normal',
                              textDecoration: nearestDatum.key === key ? 'underline' : 'none',
                            }}
                          >
                            {key}:
                          </span>{' '}
                          {value == null || Number.isNaN(Number(value)) ? '–' : Number(value).toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          )}
        </XYChart>
      )}
    </ExampleControls>
    </>
  );
}