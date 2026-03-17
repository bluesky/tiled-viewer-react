import React from 'react';
import { XYChart, Axis, Grid, GlyphSeries, Tooltip } from '@visx/xychart';
import { TiledTableRow } from './Tiled/types';

type ScatterPlotProps = {
    data: TiledTableRow[];
    xKey: string;
    yKey: string;
    width?: number;
    height?: number;
};

export default function ScatterPlot({ 
    data, 
    xKey, 
    yKey, 
    width = 600, 
    height = 400 
}: ScatterPlotProps) {
    // Filter out any invalid data points
    const validData = data.filter(d => 
        d[xKey] !== null && 
        d[yKey] !== null && 
        !isNaN(Number(d[xKey])) && 
        !isNaN(Number(d[yKey]))
    );

 const accessors = {
        xAccessor: (d: TiledTableRow) => {
            // Add safety checks
            if (!d || typeof d !== 'object' || !Object.prototype.hasOwnProperty.call(d, xKey)) {
                return 0;
            }
            const value = Number(d[xKey]);
            return isNaN(value) ? 0 : value;
        },
        yAccessor: (d: TiledTableRow) => {
            // Add safety checks
            if (!d || typeof d !== 'object' || !Object.prototype.hasOwnProperty.call(d, yKey)) {
                return 0;
            }
            const value = Number(d[yKey]);
            return isNaN(value) ? 0 : value;
        },
    };

    return (
        <div className="w-full flex justify-center">
            <XYChart
                height={height}
                width={width}
                xScale={{ type: 'linear' }}
                yScale={{ type: 'linear' }}
            >
                <Grid columns={true} rows={true} />
                <Axis 
                    orientation="bottom" 
                    label={xKey}
                />
                <Axis 
                    orientation="left" 
                    label={yKey}
                />
                <GlyphSeries
                    dataKey="scatter"
                    data={validData}
                    {...accessors}
                    size={4}

                />
                <Tooltip
                    snapTooltipToDatumX
                    snapTooltipToDatumY
                    showVerticalCrosshair
                    showHorizontalCrosshair
                    className='z-50'
                    renderTooltip={({ tooltipData }) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const datum = tooltipData?.nearestDatum?.datum as Record<string, any>;
                        return (
                            <div className="bg-white p-2 border rounded shadow">
                                <div>{xKey}: {datum?.[xKey]}</div>
                                <div>{yKey}: {datum?.[yKey]}</div>
                            </div>
                        )
                    }}
                />
            </XYChart>
        </div>
    );
}