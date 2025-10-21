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
    handleExpandClick: Function,
    isExpanded: boolean,
    apiKey?: string,
    bearerToken?: string,
    initialSearchPath?: string,
    reverseSort?: boolean,
}
export default function TiledContainer({
    url,
    handleSelectClick,
    singleColumnMode,
    handleExpandClick,
    isExpanded,
    apiKey,
    bearerToken,
    initialSearchPath,
    reverseSort,
    ...props
}: TiledContainerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const tiledData = useTiled({ url, apiKey, bearerToken, reverseSort  });

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
        handleNewPageClick
    } = tiledData;



    return (
        warning ? 
        <>
            <TiledHeader secondaryTitle={url} handleExpandClick={()=>{}} isExpanded={false} showExpandButton={false}/>
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
