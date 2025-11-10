import { TiledSearchItem, TiledStructures, Breadcrumb, TiledSearchResult } from "./types";
import { Tooltip } from "react-tooltip";
import { cn } from "@/lib/utils";
import Button from "../Button";
import { getTiledStructureIcon } from "./utils";

type TiledColumnProps = {
    data: TiledSearchItem<TiledStructures>[];
    links: TiledSearchResult['links'];
    meta: TiledSearchResult['meta'];
    onItemClick: (item: TiledSearchItem<TiledStructures>, index: number) => void;
    index: number;
    breadcrumbs: Breadcrumb[];
    handleSelectClick?: (item: TiledSearchItem<TiledStructures>) => void;
    className?: string;
    showTooltip?: boolean;
    handleNewPageClick: (link: string, columnIndex: number) => void;
};

export function TiledColumn ({data, meta, links, index, onItemClick, breadcrumbs, handleSelectClick, className, showTooltip=true, handleNewPageClick}: TiledColumnProps) {
    //console.log({links})
    //parse the links.self to get the value after ...page[offset]=
    const currentOffset = links.self ? parseInt(links.self.split('page[offset]=')[1].split('&')[0]) : 1;
    //const pageLimit = links.self ? parseInt(links.self.split('page[limit]=')[1]) : 100;
    const totalResults = meta.count;
    const currentlyDisplayedStartIndex = currentOffset + (data.length > 0 ? 1 : 0);
    const currentlyDisplayedEndIndex = currentlyDisplayedStartIndex + data.length - 1;
    const nextResultsLink = links.next ? links.next : null;
    const prevResultsLink = links.prev ? links.prev : null;
    //console.log({currentOffset, pageLimit, totalResults, currentlyDisplayedStartIndex, currentlyDisplayedEndIndex});
    return (
        <div className={cn("flex flex-col-reverse border-r border-r-slate-300 min-w-56 w-fit max-w-xs px-4 h-auto pt-2", className)}>
            {nextResultsLink || prevResultsLink ? (
                <p className="text-center text-sm py-1">
                {`${currentlyDisplayedStartIndex} - ${currentlyDisplayedEndIndex} of ${totalResults}`}
                <span onClick={prevResultsLink ? () => handleNewPageClick(prevResultsLink, index) : ()=>{}} className={`${prevResultsLink ? 'text-slate-600 hover:text-sky-500 hover:cursor-pointer' : 'text-slate-300'} text-base pl-4 pr-2`}>&lt;</span>
                <span onClick={nextResultsLink ? () => handleNewPageClick(nextResultsLink, index) : ()=>{}} className={`${nextResultsLink ? 'text-slate-600 hover:text-sky-500 hover:cursor-pointer' : 'text-slate-300'} text-base`}>&gt;</span>
                </p>
            ) : null}
            <ul className="scrollbar-always-visible overflow-y-auto flex-grow peer-hover:text-slate-500 peer-hover:border peer-hover:border-blue-400 rounded-md">
                {data.map((item:TiledSearchItem<TiledStructures>) => {
                    const id = `item-${item.id}${index}`;
                    return (
                        <li 
                            className={`${ (breadcrumbs.length > index) && breadcrumbs[index].label === item.id ? 'bg-sky-200 hover:bg-sky-300' : 'hover:bg-sky-300'} flex space-x-2 px-2 rounded-sm hover:cursor-pointer relative`} 
                            key={id}
                            onClick={()=>onItemClick(item, index)}
                            id={id}
                        >
                            <div className={`w-6 aspect-square flex-shrink-0 ${item.attributes.structure_family === 'container' || item.attributes.structure_family === 'composite' ? 'text-sky-700' : ''}`}>{getTiledStructureIcon(item)}</div>
                            <p className="truncate max-w-full">{item.id}</p>
                            {(item.attributes.structure_family === 'container' || item.attributes.structure_family === 'composite') ? <p className="absolute right-1 text-slate-500">&gt;</p> : ''}
                            {(handleSelectClick && showTooltip) &&
                                <Tooltip 
                                    children={
                                        <Button 
                                            text="Select" 
                                            size="small" 
                                            cb={(e?:React.MouseEvent)=> {
                                                e?.stopPropagation();
                                                handleSelectClick(item);
                                            }
                                        
                                        }/>
                                    } 
                                    anchorSelect={`#${id}`} 
                                    clickable 
                                    delayShow={600}
                                    opacity={1} 
                                    offset={10} 
                                    place="top" 
                                    variant="info" 
                                    style={{'maxWidth' : "500px", margin:"0", padding:"0.3rem", 'height': 'fit-content', backgroundColor: "#e9e8eb", borderWidth: "1px", borderRadius: "1rem"}}
                                />
                            }
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}