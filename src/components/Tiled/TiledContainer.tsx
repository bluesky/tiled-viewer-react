import { useRef } from 'react';

import TiledHeader from "./TiledHeader";
import TiledPreview from "./TiledPreview";
import TiledFooter from "./TiledFooter";
import TiledBody from "./TiledBody";
import TiledStartupWarning from './TiledStartupWarning';
import { TiledColumn } from "./TiledColumn";
import './Tiled.css'


import { TiledSearchItem, TiledStructures } from "./types";

import { useTiled } from './useTiled';

type TiledContainerProps = {
    url: string | undefined,
    handleSelectClick: (item: TiledSearchItem<TiledStructures> ) => void,
    singleColumnMode?: boolean,
    handleExpandClick: () => void,
    isExpanded: boolean,
    apiKey?: string,
    bearerToken?: string,
    initialSearchPath?: string,
    reverseSort?: boolean,
    showPlanName?: boolean,
    showPlanStartTime?: boolean,
    pageLimit?: number,
    reloadLastItemOnStartup?: boolean,
}
export default function TiledContainer({
    url,
    handleSelectClick,
    singleColumnMode,
    handleExpandClick,
    isExpanded,
    apiKey,
    bearerToken,
    reverseSort,
    showPlanName,
    showPlanStartTime,
    pageLimit,
    reloadLastItemOnStartup,
}: TiledContainerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const tiledData = useTiled({ url, apiKey, bearerToken, reverseSort, pageLimit, reloadLastItemOnStartup });

    if (!tiledData) {
        return <div>Error: Unable to load tiled data. Check console for error logs.</div>;
    }

    const { 
        columns, 
        breadcrumbs,
        previewItem,
        previewSize,
        handleColumnItemClick,
        handleLeftArrowClick, 
        handleRightArrowClick,
        resetAllData,
        warning,
        handleNewPageClick,
        handleSearchId,
        handleSearchMetadata,
        handleSearchSpec,
    } = tiledData;

    return (
        warning ? 
        <>
            <TiledHeader secondaryTitle={url} handleExpandClick={()=>{}} isExpanded={false} showExpandButton={false} showSearchBar={false} />
            <TiledStartupWarning warningMessage={warning} />    
        </>
            :
            <>
                <TiledHeader 
                    breadcrumbs={breadcrumbs} 
                    onLeftArrowClick={handleLeftArrowClick} 
                    onRightArrowClick={handleRightArrowClick} 
                    onHomeClick={resetAllData} 
                    secondaryTitle={url}
                    handleExpandClick={handleExpandClick}
                    isExpanded={isExpanded}
                    handleSearchId={handleSearchId}
                    handleSearchMetadata={handleSearchMetadata}
                    handleSearchSpec={handleSearchSpec}
                    showSearchBar={columns.length > 0}
                />
                <TiledBody ref={scrollContainerRef}>
                    {/* <TiledColumns 
                        columns={columns} 
                        breadcrumbs={breadcrumbs} 
                        onItemClick={handleColumnItemClick} 
                        handleSelectClick={handleSelectClick}
                    /> */}
                    {columns.map((column, index) => 
                        <TiledColumn 
                            handleSelectClick={handleSelectClick} 
                            data={column.data} 
                            meta={column.meta}
                            links={column.links}
                            key={index} 
                            index={index} 
                            onItemClick={singleColumnMode ? handleSelectClick : handleColumnItemClick} 
                            breadcrumbs={breadcrumbs}
                            className={singleColumnMode ? "w-full max-w-full" : ""}
                            showTooltip={singleColumnMode ? false : true}
                            handleNewPageClick={handleNewPageClick}
                            showPlanName={showPlanName}
                            showPlanStartTime={showPlanStartTime}
                        />
                    )}
                    {previewItem && 
                        <TiledPreview 
                            previewItem={previewItem} 
                            previewSize={previewSize} 
                            handleSelectClick={handleSelectClick} 
                            url={url}
                            scrollContainerRef={scrollContainerRef}
                        />
                    }
                </TiledBody>
                <TiledFooter breadcrumbs={breadcrumbs}/>
            </>
        
    )
}
