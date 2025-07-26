import { useState } from "react";
import TiledContainer from "./TiledContainer";
import StartupScreen from "./StartupScreen";
import OpenTiledRow from "./OpenTiledRow";
import './Tiled.css'

import { cn } from "@/lib/utils";
import { TiledItemLinks, TiledSearchItem, TiledStructures } from "./types";
import { generateLinksForCallback, getApiKeyFromLocalStorage } from "./utils";


export type TiledProps = {
    onSelectCallback?: (links: TiledItemLinks) => void,
    apiKey?: string,
    bearerToken?: string,
    size?: 'small' | 'medium' | 'large'
    closeOnSelect?: boolean,
    isPopup?: boolean,
    enableStartupScreen?: boolean,
    tiledBaseUrl?: string,
    backgroundClassName?: string,
    singleColumnMode?: boolean,
    contentClassName?: string,
    isFullWidth?: boolean,
    isButtonMode?: boolean,
    buttonModeText?: string,
}
export default function Tiled({
    onSelectCallback,
    apiKey,
    bearerToken,
    size,
    closeOnSelect=false,
    isPopup,
    enableStartupScreen=false,
    tiledBaseUrl,
    backgroundClassName,
    contentClassName,
    singleColumnMode=false,
    isFullWidth=false,
    isButtonMode=false,
    buttonModeText="Select Data",
    ...props
}: TiledProps) {
    const [ isClosed, setIsClosed ] = useState<boolean>(false);
    const [ showStartupScreen, setShowStartupScreen ] = useState<boolean>(true);
    const [ isViewerOpen, setIsViewerOpen ] = useState<boolean>(!isButtonMode);
    const [ url, setUrl ] = useState<undefined | string>(tiledBaseUrl);
    const [ isExpanded, setIsExpanded ] = useState<boolean>(false);
    const [ selectedData, setSelectedData ] = useState<TiledItemLinks | null>(null);
    const [ userInputApiKey, setUserInputApiKey ] = useState<string | undefined>(apiKey || getApiKeyFromLocalStorage());

    const handleSelectClick = (item:TiledSearchItem<TiledStructures>) => {
        const links = generateLinksForCallback(item, url);
        setSelectedData(links);
        onSelectCallback && onSelectCallback(links);
        closeOnSelect && setIsClosed(true);
        isButtonMode && setIsViewerOpen(false);
    };

    const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsViewerOpen(false);
    };

    const sizeClassMap = {
        small: 'w-[600px] h-[500px]',
        medium: 'w-[800px] h-[800px]',
        large: 'w-[1200px] h-[1200px]',
    };

    const expandedSizeClassMap = {
        small: 'w-[800px] h-[800px]',
        medium: 'w-[1000px] h-[1000px]',
        large: 'w-[1600px] h-[1600px]',
    };

    const handleExpandClick = () => {
        setIsExpanded(!isExpanded);
    };

    const handleStartupScreenSubmit = () => {
        setShowStartupScreen(false);
    };

    const handleApiKeyChange = (newApiKey: string) => {
        setUserInputApiKey(newApiKey);
        localStorage.setItem('tiledApiKey', newApiKey);
    };


    if (!isClosed) {
        // if (isButtonMode && !isViewerOpen) {
        //     return (
        //         <OpenTiledRow
        //             userInputApiKey={userInputApiKey}
        //             setIsViewerOpen={setIsViewerOpen}
        //             buttonModeText={buttonModeText}
        //             selectedData={selectedData}
        //             handleInputChange={handleApiKeyChange}   
        //         />        
        //     )
        // } else {
            return (
                <>
                    { isButtonMode && (
                        <OpenTiledRow
                            userInputApiKey={userInputApiKey}
                            setIsViewerOpen={setIsViewerOpen}
                            buttonModeText={buttonModeText}
                            selectedData={selectedData}
                            handleInputChange={handleApiKeyChange}
                        />
                    )}

                    { isViewerOpen && (
                        <div
                            className={cn(
                                (isPopup || isButtonMode)
                                ? "fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
                                : `flex w-full h-full min-w-[600px] min-h-[500px] justify-center items-center ${
                                    size && sizeClassMap[size]
                                    } ${(size && isExpanded) && expandedSizeClassMap[size]}`,
                                backgroundClassName
                            )}
                            onClick={handleClickOutside}
                            {...props}
                        >
                            <div
                                className={cn(
                                `flex flex-col border border-slate-400 shadow-lg rounded-md bg-white max-w-full max-h-full ${
                                    size ? sizeClassMap[size] : `h-1/2 w-1/2 min-w-[600px] min-h-[500px]`
                                } ${isFullWidth && 'w-full'} ${isExpanded && (size ? expandedSizeClassMap[size] : 'h-full w-full')}`,
                                contentClassName
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {enableStartupScreen && showStartupScreen ? (
                                <StartupScreen
                                    url={url}
                                    handleUrlChange={setUrl}
                                    handleSubmit={handleStartupScreenSubmit}
                                />
                                ) : (
                                    <>
                                        <TiledContainer
                                            url={url}
                                            handleSelectClick={handleSelectClick}
                                            singleColumnMode={singleColumnMode}
                                            handleExpandClick={handleExpandClick}
                                            isExpanded={isExpanded}
                                            apiKey={userInputApiKey}
                                            bearerToken={bearerToken}
                                        />
                                        <p className="absolute top-12 text-center text-gray-200 text-3xl  -translate-x-1/2 left-1/2" >Select an Item or Click Outside to Close</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) 
        // }
    }
}
