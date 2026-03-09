import { useState, useCallback } from "react";
import TiledContainer from "./TiledContainer";
import Login from "./Login";
import StartupScreen from "./StartupScreen";
import OpenTiledRow from "./OpenTiledRow";
import './Tiled.css'

import { cn } from "@/lib/utils";
import { TiledItemLinks, TiledItemSelectionData, TiledSearchItem, TiledStructures } from "./types";
import { generateLinksForCallback, getApiKeyFromLocalStorage, getAuthFromLocalStorage } from "./utils";
import { setAuthErrorCallback, setInitialPath } from "./apiClient";


export type TiledProps = {
    onSelectCallback?: (data: TiledItemSelectionData) => void,
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
    expandedContentClassName?: string,
    isFullWidth?: boolean,
    isButtonMode?: boolean,
    inButtonModeShowApiKeyInput?: boolean,
    inButtonModeShowReverseSortInput?: boolean,
    inButtonModeShowSelectedData?: boolean,
    buttonModeText?: string,
    reverseSort?: boolean,
    initialPath?: string,
    showPlanName?: boolean,
    showPlanStartTime?: boolean,
    pageLimit?: number,
    reloadLastItemOnStartup?: boolean,
    includeAuthTokensInSelectCallback?: boolean,
    oidcRedirectUrl?: string,

}
export default function Tiled({
    onSelectCallback,
    apiKey,
    bearerToken,
    size='small',
    closeOnSelect=false,
    isPopup,
    enableStartupScreen=false,
    tiledBaseUrl,
    backgroundClassName,
    contentClassName,
    expandedContentClassName,
    singleColumnMode=false,
    isFullWidth=false,
    isButtonMode=false,
    inButtonModeShowApiKeyInput,
    inButtonModeShowReverseSortInput,
    inButtonModeShowSelectedData,
    buttonModeText="Select Data",
    reverseSort=true,
    initialPath,
    showPlanName,
    showPlanStartTime,
    pageLimit,
    reloadLastItemOnStartup,
    includeAuthTokensInSelectCallback=false,
    oidcRedirectUrl,
    ...props
}: TiledProps) {
    const [ isClosed, setIsClosed ] = useState<boolean>(false);
    const [ showStartupScreen, setShowStartupScreen ] = useState<boolean>(true);
    const [ isViewerOpen, setIsViewerOpen ] = useState<boolean>(!isButtonMode);
    const [ url, setUrl ] = useState<undefined | string>(tiledBaseUrl);
    const [ isExpanded, setIsExpanded ] = useState<boolean>(false);
    const [ selectedData, setSelectedData ] = useState<TiledItemLinks | null>(null);
    const [ userInputApiKey, setUserInputApiKey ] = useState<string | undefined>(apiKey || getApiKeyFromLocalStorage());
    const [ userInputReverseSort, setUserInputReverseSort ] = useState<boolean>(reverseSort || false);
    const [ showLogin, setShowLogin ] = useState<boolean>(false);

    //on 401 errors show the login component
    setAuthErrorCallback((error) => {
        console.error("Authentication error:", error);
        setShowLogin(true);
    });

    if (initialPath) {
        setInitialPath(initialPath);
    }

    const handleLoginSuccess = useCallback(() => {
        setShowLogin(false);
    }, []);

    const handleSelectClick = (item:TiledSearchItem<TiledStructures>, currentSlice?: number[]) => {
        const links: TiledItemLinks = generateLinksForCallback(item, url);
        setSelectedData(links);
        const selectedDataInfo: TiledItemSelectionData =  {...links, id: item.id, ancestors: item.attributes.ancestors};
        if (includeAuthTokensInSelectCallback) {
            //get from local storage
            const tokens = getAuthFromLocalStorage();
            if (tokens) {
                selectedDataInfo.refreshToken = tokens.refreshToken;
                selectedDataInfo.accessToken = tokens.accessToken;
            } else {
                selectedDataInfo.refreshToken = null;
                selectedDataInfo.accessToken = null;
            }
        }
        if (currentSlice) {
            selectedDataInfo.currentSlice = currentSlice;
        }
        onSelectCallback?.(selectedDataInfo);
        if (closeOnSelect) {
            setIsClosed(true);
        }
        if (isButtonMode) {
            setIsViewerOpen(false);
        }
    };

    const handleClickOutside = () => {
        (isPopup || isButtonMode) && setIsViewerOpen(false);
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
            return (
                <>
                    { isButtonMode && (
                        <OpenTiledRow
                            userInputApiKey={userInputApiKey}
                            setIsViewerOpen={setIsViewerOpen}
                            buttonModeText={buttonModeText}
                            selectedData={selectedData}
                            userInputReverseSort={userInputReverseSort}
                            handleReverseSortChange={setUserInputReverseSort}
                            handleInputChange={handleApiKeyChange}
                            showApiKeyInput={inButtonModeShowApiKeyInput}
                            showReverseSortInput={inButtonModeShowReverseSortInput}
                            showSelectedData={inButtonModeShowSelectedData}
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
                                    `
                                        flex flex-col border border-slate-400 shadow-lg rounded-md bg-white max-w-full max-h-full 
                                        ${ (isPopup || isButtonMode) ? 'h-full w-full max-h-[calc(100vh-12rem)] min-h-[500px] max-w-[calc(100vw-12rem)] min-w-[500px]' : (sizeClassMap[size])} 
                                        ${isFullWidth ? 'w-full' : ''} ${isExpanded ? cn((size ? expandedSizeClassMap[size] : 'h-full w-full'), expandedContentClassName) : ''}
                                    `,
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
                                        {showLogin ? 
                                            <Login onSuccess={handleLoginSuccess} url={url} oidcRedirectUrl={oidcRedirectUrl}/> 
                                        :                                 
                                            <TiledContainer
                                                url={url}
                                                handleSelectClick={handleSelectClick}
                                                singleColumnMode={singleColumnMode}
                                                handleExpandClick={handleExpandClick}
                                                isExpanded={isExpanded}
                                                apiKey={userInputApiKey}
                                                bearerToken={bearerToken}
                                                reverseSort={userInputReverseSort}
                                                showPlanName={showPlanName}
                                                showPlanStartTime={showPlanStartTime}
                                                pageLimit={pageLimit}
                                                reloadLastItemOnStartup={reloadLastItemOnStartup}
                                            />
                                        }
                                        {(isPopup || isButtonMode) && (
                                            <p className="w-full absolute top-8 text-center text-gray-200 text-3xl -translate-x-1/2 left-1/2 hover:cursor-default" onClick={handleClickOutside}>Select an Item or Click Outside to Close</p>
                                        )}
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
