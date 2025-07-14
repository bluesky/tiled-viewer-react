import { useRef } from 'react';

import TiledHeader from "./TiledHeader";
import TiledColumns from "./TiledColumns";
import TiledPreview from "./TiledPreview";
import TiledFooter from "./TiledFooter";
import TiledBody from "./TiledBody";
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
}
export default function TiledContainer({
    url,
    handleSelectClick,
    singleColumnMode,
    handleExpandClick,
    isExpanded,
    apiKey,
    bearerToken,
    ...props
}: TiledContainerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { 
        columns, 
        breadcrumbs,
        previewItem,
        previewSize,
        handleColumnItemClick,
        handleLeftArrowClick, 
        handleRightArrowClick,
        resetAllData,
    } = useTiled(url, apiKey, bearerToken);

    return (
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
                        key={index} 
                        index={index} 
                        onItemClick={singleColumnMode ? handleSelectClick : handleColumnItemClick} 
                        breadcrumbs={breadcrumbs}
                        className={singleColumnMode ? "w-full max-w-full" : ""}
                        showTooltip={singleColumnMode ? false : true}
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
