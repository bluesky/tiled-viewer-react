import { useState, useEffect, useRef, useCallback } from "react";
import { TiledSearchItem, StructuredArrayStructure, TiledTableRow } from "./types";
import { getStructuredArrayData } from "./apiClient";
import { generateSearchPath } from "./utils";
import InputSliderRange from "../InputSliderRange";
import VisxLinePlot from "../VisxLinePlot/VisxLinePlot";
import SelectInteger from "../SelectInteger";
import Table from "./Table";

type PreviewStructuredArrayProps = {
    structuredArrayItem: TiledSearchItem<StructuredArrayStructure>;
    url?: string
};

export default function PreviewStructuredArray({ structuredArrayItem, url }: PreviewStructuredArrayProps) {
    console.log({ structuredArrayItem });
    const [structuredArrayData, setStructuredArrayData] = useState<TiledTableRow[]>([]);
    const [visibleData, setVisibleData] = useState<TiledTableRow[]>([]);
    const [block, setBlock] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [domain, setDomain] = useState<[number, number] | undefined>(undefined);

    const observerRef = useRef<HTMLDivElement | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);

    // Calculate block count based on chunks (similar to partitions for tables)
    const blockCount = structuredArrayItem.attributes.structure.chunks[0].length;
    const searchPath = generateSearchPath(structuredArrayItem);
    const rowLoadSize = 20;

    // Extract column names from the structured array fields
    const columns = structuredArrayItem.attributes.structure.data_type.fields.map(field => field.name);

    const updateStructuredArray = (newStructuredArrayData: TiledTableRow[]) => {
        console.log({ newStructuredArrayData });
        setStructuredArrayData(newStructuredArrayData);
        setVisibleData(newStructuredArrayData.slice(0, rowLoadSize));
        setIsLoading(false);
        setDomain([0, newStructuredArrayData.length - 1]);
    };

    const handleBlockChange = useCallback((newValue: number) => {
        setIsLoading(true);
        getStructuredArrayData(searchPath, newValue, url, updateStructuredArray);
        setBlock(newValue);
    }, [structuredArrayItem, searchPath, url]);

    useEffect(() => {
        console.log('Fetching structured array data for block:', block);
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
        }
        const searchPath = generateSearchPath(structuredArrayItem);
        setBlock(0);
        getStructuredArrayData(searchPath, 0, url, updateStructuredArray);
    }, [structuredArrayItem]);

    const loadMoreRows = useCallback(() => {
        setVisibleData((prev) => {
            const nextRows = structuredArrayData.slice(prev.length, prev.length + rowLoadSize);
            return [...prev, ...nextRows];
        });
    }, [structuredArrayData]);

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
            <p className="text-sky-900 text-center mb-4">{structuredArrayItem.id}</p>

            <Table
                isLoading={isLoading}
                columns={columns}
                visibleData={visibleData}
                observerRef={observerRef}
                isStructuredArray={true}
            />

            {/* block selector */}
            {blockCount > 1 && 
                <SelectInteger
                    value={block}
                    min={0}
                    max={blockCount - 1}
                    onChange={handleBlockChange}
                    label="Block"
                    className="mt-4"
                />
            }

            {/* scatter plot */}
            {columns.length >= 8 && (
                <div className={`${isLoading ? 'animate-pulse opacity-50' : ''} mt-8 mb-4 shadow-md p-2 rounded border border-slate-100`}>
                    <h3 className="text-center mt-4">{structuredArrayItem.id}</h3>
                    {blockCount > 1 && (
                        <p className="text-center text-sm text-gray-500">Block: {block}</p>
                    )}

                    <InputSliderRange
                        min={0}
                        max={structuredArrayData.length - 1}
                        value={domain || [0, structuredArrayData.length - 1]}
                        showSideInput={false}
                        onChange={setDomain}
                        className="px-12"
                    />

                    {/* Scatter plot */}
                    <VisxLinePlot
                        plotData={structuredArrayData}
                        domain={domain}
                    />
                </div>
            )}
        </div>
    );
}