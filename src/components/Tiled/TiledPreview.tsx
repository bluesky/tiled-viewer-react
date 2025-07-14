import { useState, useEffect } from 'react';
import Button from '../Button';
import PreviewNDArray from './PreviewNDArray';
import PreviewTable from './PreviewTable';
import { PreviewSize, TiledSearchItem, ArrayStructure, TableStructure, isArrayStructure, isTableStructure } from './types';
import TiledPreviewMetadata from './TiledPreviewMetadata';
import { tailwindIcons } from '@/assets/icons';


type TiledPreviewProps = {
    previewItem: TiledSearchItem<ArrayStructure> | TiledSearchItem<TableStructure>
    previewSize: PreviewSize;
    handleSelectClick?:Function;
    url?: string;
    scrollContainerRef: React.RefObject<HTMLDivElement>;

}
export default function TiledPreview({
    previewItem,
    handleSelectClick,
    previewSize='medium',
    url,
    scrollContainerRef,
    ...props
}: TiledPreviewProps) {

    const [ isFullWidth, setIsFullWidth ] = useState<boolean>(false);

    const previewSizeMap = {
        'hidden': 'hidden',
        'small': 'min-w-72',
        'medium': 'min-w-96',
        'large': 'min-w-[30rem]'
    }

    useEffect(() => {
        //when columns load scroll to the right
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        } 
    }, [isFullWidth]);


    return (
        <div className={`${previewSizeMap[previewSize]} flex-grow h-full flex flex-col overflow-y-auto relative max-w-full ${isFullWidth && 'min-w-full'}`} {...props}>
            <div className="flex justify-between px-2 pt-2 absolute top-0 w-full">
                <div className="h-6 aspect-square hover:cursor-pointer hover:text-slate-600" onClick={()=>setIsFullWidth(!isFullWidth)}>{isFullWidth ? tailwindIcons.arrowsPointingIn : tailwindIcons.arrowsPointingOut}</div>
                <div className="h-6 aspect-square hover:cursor-pointer hover:text-slate-600">{tailwindIcons.arrowDownTray}</div>
            </div>
            <div className="w-full flex flex-col items-center space-y-8 py-4">
                {isArrayStructure(previewItem) && <PreviewNDArray arrayItem={previewItem} url={url} isFullWidth={isFullWidth}/>}
                {isTableStructure(previewItem) && <PreviewTable tableItem={previewItem} url={url} />}
                { handleSelectClick && <Button text="Select" size="medium" cb={()=>handleSelectClick(previewItem)} />}
            </div>
            <TiledPreviewMetadata item={previewItem}/>
        </div>
    )
}

