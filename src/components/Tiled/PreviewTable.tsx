import { useState, useEffect, useRef, useCallback } from "react";
import { TiledSearchItem, TableStructure, TiledTableRow } from "./types";
import { getTableData } from "./apiClient";
import { generateSearchPath } from "./utils";
import InputSlider from "../InputSlider";
import ScatterPlot from "../ScatterPlot";

type PreviewTableProps = {
    tableItem: TiledSearchItem<TableStructure>;
    url?: string
};

export default function PreviewTable({ tableItem, url }: PreviewTableProps) {
    const [tableData, setTableData] = useState<TiledTableRow[]>([]);
    console.log({tableData})
    const [visibleData, setVisibleData] = useState<TiledTableRow[]>([]);
    const [partition, setPartition] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showScatterPlot, setShowScatterPlot] = useState<boolean>(true);
    const [xColumn, setXColumn] = useState<string>('');
    const [yColumn, setYColumn] = useState<string>('');
    
    const observerRef = useRef<HTMLDivElement | null>(null);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);

    const partitionCount = tableItem.attributes.structure.npartitions;
    const searchPath = generateSearchPath(tableItem);
    const rowLoadSize = 20;

    const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

    const updateTable = (newTableData: TiledTableRow[]) => {
        setTableData(newTableData);
        setVisibleData(newTableData.slice(0, rowLoadSize));
        setIsLoading(false);
    };

    const handlePartitionChange = useCallback((newValue: number) => {
        setIsLoading(true);
        getTableData(searchPath, newValue, url, updateTable);
        setPartition(newValue);
    }, [tableItem]);

    useEffect(() => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0
        }
        const searchPath = generateSearchPath(tableItem);
        setPartition(0);
        getTableData(searchPath, 0, url, updateTable);
    }, [tableItem]);

    const loadMoreRows = useCallback(() => {
        setVisibleData((prev) => {
            const nextRows = tableData.slice(prev.length, prev.length + rowLoadSize);
            return [...prev, ...nextRows];
        });
    }, [tableData]);

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

    useEffect(() => {
        if (columns.length >= 2) {
            setXColumn(columns[0]);
            setYColumn(columns[1]);
        }
    }, [columns]);

    return (
        <div className="w-full px-12">
            <p className="text-sky-900 text-center mb-4">{tableItem.id}</p>

            
            <div ref={tableContainerRef} className="h-96 overflow-auto max-w-[100%] w-fit m-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center w-full h-20 overflow-hidden">
                        {/* Loading Wheel */}
                        <svg className="animate-spin h-10 w-10 overflow-hidden text-slate-400 m-auto my-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <table className="m-auto border border-gray-300 shadow-md h-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col} className="border border-gray-300 px-4 py-2 text-left">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-100">
                                    {columns.map((col) => (
                                        <td key={col} className="border border-gray-300 px-4 py-2">
                                            {row[col].toFixed(4)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {/* when scroll approaches observerRef more values are loaded */}
                <div ref={observerRef} className="h-4"></div>
            </div>
            {partitionCount > 1 && 
                <div className="pb-1 pt-4">
                    <InputSlider label="Partition Index" max={partitionCount - 1} min={0} value={partition} onChange={handlePartitionChange} />
                </div>
            }
            {/* scatter plot goes here from visx */}
            {false && showScatterPlot && columns.length >= 2 && (
                <div className="mb-4">
                    {/* Column selectors */}
                    <div className="flex justify-center space-x-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">X Axis:</label>
                            <select
                                value={xColumn}
                                onChange={(e) => setXColumn(e.target.value)}
                                className="border rounded px-2 py-1"
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Y Axis:</label>
                            <select
                                value={yColumn}
                                onChange={(e) => setYColumn(e.target.value)}
                                className="border rounded px-2 py-1"
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Scatter plot */}
                    <ScatterPlot
                        data={tableData}
                        xKey={xColumn}
                        yKey={yColumn}
                        width={600}
                        height={400}
                    />
                </div>
            )}

        </div>
    );
}
