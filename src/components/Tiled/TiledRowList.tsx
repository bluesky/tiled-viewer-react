import { TiledSearchItem, TiledStructures, Breadcrumb, TiledSearchResult } from "./types";
import { getTiledStructureIcon } from "./utils";
import { tailwindIcons } from "@/assets/icons";
import { isContainerStructure } from "./types";
import dayjs from "dayjs";

type TiledRowListProps = {
    columns: TiledSearchResult[];
    breadcrumbs: Breadcrumb[];
    onItemClick: (item: TiledSearchItem<TiledStructures>, depth: number) => void;
    handleNewPageClick: (link: string, columnIndex: number) => void;
    showPlanName?: boolean;
    showPlanStartTime?: boolean;
};

export default function TiledRowList({
    columns,
    breadcrumbs,
    onItemClick,
    handleNewPageClick,
    showPlanName = true,
    showPlanStartTime = true,
}: TiledRowListProps) {
    if (columns.length === 0) return null;

    const renderLevel = (depth: number): React.ReactNode => {
        if (depth >= columns.length) return null;
        const column = columns[depth];

        const currentOffset = (() => {
            if (!column.links.self) return 0;
            const match = column.links.self.match(/page\[offset\]=(\d+)/);
            return match ? parseInt(match[1]) : 0;
        })();
        const totalResults = column.meta.count;
        const startIndex = currentOffset + (column.data.length > 0 ? 1 : 0);
        const endIndex = startIndex + column.data.length - 1;
        const nextLink = column.links.next ?? null;
        const prevLink = column.links.prev ?? null;

        return (
            <>
                {column.data.map((item: TiledSearchItem<TiledStructures>) => {
                    const isContainer = isContainerStructure(item);
                    const isExpanded = isContainer && breadcrumbs.length > depth && breadcrumbs[depth].label === item.id;
                    const blueskyPlanName = item?.attributes?.metadata?.start?.plan_name || '';
                    const blueskyStartTime = item?.attributes?.metadata?.start?.time
                        ? dayjs.unix(item.attributes.metadata.start.time).format('MM/DD HH:mm')
                        : '';
                    const displayText = `${showPlanStartTime ? blueskyStartTime : ''} ${showPlanName ? blueskyPlanName : ''}  ${item.id}`.trim();

                    return (
                        <div key={`${item.id}-${depth}`}>
                            <div
                                className={`flex items-center space-x-2 px-2 py-0.5 rounded-sm hover:cursor-pointer hover:bg-sky-300 ${
                                    isExpanded || (!isContainer && breadcrumbs.length > depth && breadcrumbs[depth].label === item.id)
                                        ? 'bg-sky-200 hover:bg-sky-300'
                                        : ''
                                }`}
                                style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
                                onClick={() => onItemClick(item, depth)}
                            >
                                <div className={`w-5 h-5 flex-shrink-0 ${isContainer ? 'text-sky-700' : ''}`}>
                                    {getTiledStructureIcon(item)}
                                </div>
                                <p className="truncate flex-grow text-sm">{displayText}</p>
                                {isContainer && (
                                    <div className="flex-shrink-0 text-slate-400 w-fit h-fit">
                                        {isExpanded ? tailwindIcons.chevronUp : tailwindIcons.chevronDown}
                                    </div>
                                )}
                            </div>
                            {isExpanded && renderLevel(depth + 1)}
                        </div>
                    );
                })}
                {(nextLink || prevLink) && (
                    <p
                        className="text-center text-sm py-1"
                        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
                    >
                        {`${startIndex} - ${endIndex} of ${totalResults}`}
                        <span
                            onClick={prevLink ? () => handleNewPageClick(prevLink, depth) : undefined}
                            className={`${prevLink ? 'text-slate-600 hover:text-sky-500 hover:cursor-pointer' : 'text-slate-300'} text-base pl-4 pr-2`}
                        >
                            &lt;
                        </span>
                        <span
                            onClick={nextLink ? () => handleNewPageClick(nextLink, depth) : undefined}
                            className={`${nextLink ? 'text-slate-600 hover:text-sky-500 hover:cursor-pointer' : 'text-slate-300'} text-base`}
                        >
                            &gt;
                        </span>
                    </p>
                )}
            </>
        );
    };

    return <ul className="py-2">{renderLevel(0)}</ul>;
}
