import { useState, useEffect, useCallback, useRef } from "react";

import TiledHeader from "./TiledHeader";
import LoginUsernamePassword from "./LoginUsernamePassword";
import LoginSelectProvider from "./LoginSelectProvider";
import LoginOIDC from "./LoginOIDC";
import LoginHelp from "./LoginHelp";
import Button from "../Button";

import { Warning, Key, Info, Lock } from "@phosphor-icons/react";

import { getServerInfo } from "./apiClient";
import { TiledAuthProvider, TiledInfoResponse } from "./types";


export type LoginProps = {
    onSuccess: () => void;
    url?: string;
}
export default function Login({ onSuccess, url }: LoginProps) {
    const [ warning, setWarning ] = useState< string | null>(null);
    const [ serverInfo, setServerInfo ] = useState<TiledInfoResponse | null>(null);
    const [ selectedProvider, setSelectedProvider ] = useState<TiledAuthProvider | null>(null);

    useEffect(() => {
        const fetchServerInfo = async () => {
            const info = await getServerInfo(url);
            //console.log(info)
            if (info !== null) {
                setServerInfo(info as TiledInfoResponse);
                setWarning(null);
            } else {
                //unlikely to occur because we should only render the login component if we previously reached the server (and it responded with a 401)
                setWarning("Could not fetch server info on public route. Please ensure the Tiled server is running and accessible.");

                //it is also possible that there is a cookie on the client with and invalid session causing continued 401 errors
                //this needs further testing but should be resolved here only when we get a 401 error
            }
        };
        fetchServerInfo();
    }, []);

    return (
        <div className="w-full h-full bg-white flex flex-col items-center">
            <TiledHeader handleExpandClick={()=>{}} isExpanded={false} secondaryTitle={url} showExpandButton={false}/>
            {selectedProvider === null &&
                <LoginSelectProvider handleClick={setSelectedProvider} providers={serverInfo?.authentication?.providers || []} />        
            }
            {(selectedProvider?.mode === 'password' || selectedProvider?.mode === 'internal') && 
                <LoginUsernamePassword onSuccess={onSuccess} url={url} setWarning={setWarning} handleCancel={() => setSelectedProvider(null)} provider={selectedProvider}/>
            }
            {selectedProvider?.mode === 'external' && 
                <LoginOIDC handleCancel={() => setSelectedProvider(null)} provider={selectedProvider}/>
            }
            {warning && 
                <section className="flex items-center max-w-72 m-auto space-x-4 my-4 flex-shrink-0">
                    <Warning className="text-red-700 flex-shrink-0" size={32}/>
                    <p className="text-red-700 text-left text-sm">{warning}</p>
                </section>
            }
            <LoginHelp serverInfo={serverInfo} />
        </div>
    )
}