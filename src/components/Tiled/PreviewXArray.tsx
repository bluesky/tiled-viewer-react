import { useState, useEffect, useRef, useCallback } from "react";
import { TiledSearchItem, XArrayStructure, TiledTableRow } from "./types";
import { getXArrayData } from "./apiClient";
import { generateSearchPath } from "./utils";
import InputSliderRange from "../InputSliderRange";
import VisxLinePlot from "../VisxLinePlot/VisxLinePlot";
import SelectInteger from "../SelectInteger";
import Table from "./Table";

type PreviewXArrayProps = {
    xarrayItem: TiledSearchItem<XArrayStructure>;
    url?: string
};

export default function PreviewXArray({ xarrayItem, url }: PreviewXArrayProps) {
    const [xarrayData, setXarrayData] = useState<number[][]>([]);
    const [visibleData, setVisibleData] = useState<TiledTableRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [domain, setDomain] = useState<[number, number] | undefined>(undefined);

    const observerRef = useRef<HTMLDivElement | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);

    const structure = xarrayItem.attributes.structure;
    const searchPath = generateSearchPath(xarrayItem);
    const rowLoadSize = 20;

    // Extract dimension names and calculate block counts for each dimension
    const dims = structure.dims;
    const shape = structure.shape;
    const chunks = structure.chunks;
    
    // For table display, use dimension names as columns
    const columns = dims;

    // Convert multi-dimensional array data to table format for display
    const convertToTableFormat = (data: number[][]): TiledTableRow[] => {
        if (!data || data.length === 0) return [];
        
        // For 1D data
        if (dims.length === 1) {
            return data.map((value, index) => ({
                [dims[0]]: index,
                value: Array.isArray(value) ? value[0] : value
            }));
        }
        
        // For 2D+ data, flatten and create coordinate pairs
        const tableRows: TiledTableRow[] = [];
        const flattenData = (arr: any[], coords: number[] = []): void => {
            if (Array.isArray(arr[0])) {
                arr.forEach((subArr, index) => {
                    flattenData(subArr, [...coords, index]);
                });
            } else {
                arr.forEach((value, index) => {
                    const row: TiledTableRow = {};
                    dims.forEach((dim, dimIndex) => {
                        row[dim] = coords[dimIndex] || index;
                    });
                    row.value = value;
                    tableRows.push(row);
                });
            }
        };
        
        flattenData(data);
        return tableRows;
    };

    const updateXArray = (newXArrayData: number[][]) => {
        setXarrayData(newXArrayData);
        const tableData = convertToTableFormat(newXArrayData);
        setVisibleData(tableData.slice(0, rowLoadSize));
        setIsLoading(false);
        setDomain([0, tableData.length - 1]);
    };

    useEffect(() => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
        }
        getXArrayData(searchPath, [], url, updateXArray);
    }, [xarrayItem]);

    const loadMoreRows = useCallback(() => {
        const tableData = convertToTableFormat(xarrayData);
        setVisibleData((prev) => {
            const nextRows = tableData.slice(prev.length, prev.length + rowLoadSize);
            return [...prev, ...nextRows];
        });
    }, [xarrayData]);

    useEffect(() => {
        if (!observerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreRows();
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(observerRef.current);

        return () => observer.disconnect();
    }, [loadMoreRows]);

    return (
        <div className="w-full px-12">
            <p className="text-sky-900 text-center mb-4">{xarrayItem.id}</p>
            
            {/* Dimension info */}
            <div className="mb-4 text-center">
                <p className="text-sm text-gray-600">
                    Dimensions: {dims.map((dim, i) => `${dim}(${shape[i]})`).join(' × ')}
                </p>
            </div>

            <Table
                isLoading={isLoading}
                columns={[...columns, 'value']}
                visibleData={visibleData}
                observerRef={observerRef}
            />

            {/* Block selectors for each dimension */}
            {/* {dims.length > 1 && (
                <div className="mt-4 space-y-2">
                    {dims.map((dim, dimIndex) => {
                        const maxBlocks = chunks[dimIndex]?.length || 1;
                        return maxBlocks > 1 ? (
                            <SelectInteger
                                key={dim}
                                value={block || 0}
                                min={0}
                                max={maxBlocks - 1}
                                onChange={(newValue) => handleBlockChange(dimIndex, newValue)}
                                label={`${dim} Block`}
                                className="inline-block mr-4"
                            />
                        ) : null;
                    })}
                </div>
            )} */}

            {/* Line plot for 1D data or coordinate visualization */}
            {/* {dims.length <= 2 && (
                <div className={`${isLoading ? 'animate-pulse opacity-50' : ''} mt-8 mb-4 shadow-md p-2 rounded border border-slate-100`}>
                    <h3 className="text-center mt-4">{xarrayItem.id}</h3>
                    <p className="text-center text-sm text-gray-500">
                        {dims.map((dim, i) => `${dim}: ${shape[i]}`).join(' × ')}
                    </p>

                    <InputSliderRange
                        min={0}
                        max={visibleData.length - 1}
                        value={domain || [0, visibleData.length - 1]}
                        showSideInput={false}
                        onChange={setDomain}
                        className="px-12"
                    />

                    <VisxLinePlot
                        plotData={visibleData}
                        domain={domain}
                    />
                </div>
            )} */}
        </div>
    );
}