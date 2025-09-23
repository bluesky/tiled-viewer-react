import { useState, useEffect, useCallback, useRef } from "react";

import TiledHeader from "./TiledHeader";
import Button from "../Button";

import { Warning, Key, Info, Lock } from "@phosphor-icons/react";

import { getServerInfo, loginUser, getDefaultTiledUrl } from "./apiClient";


export type LoginProps = {
    onSuccess: () => void;
    url?: string;
}
export default function Login({ onSuccess, url }: LoginProps) {
    const [ warning, setWarning ] = useState< string | null>(null);
    const [ username, setUsername ] = useState<string>('');
    const [ password, setPassword ] = useState<string>('');
    const [ showHelp, setShowHelp ] = useState<boolean>(false);
    const [ serverInfo, setServerInfo ] = useState<{[key: string]: any} | null>(null);

    const passwordRef = useRef<HTMLInputElement>(null);

    const attemptLogin = useCallback(async () => {
        setWarning(null);
        const result = await loginUser(username, password, url);
        if (result) {
            onSuccess();
        } else {
            setWarning("Login failed. Please check your credentials.");
            //put focus back on the password field
            if (passwordRef.current) {
                passwordRef.current.focus();
                passwordRef.current.select();
            }
        }
    }, [username, password, onSuccess]);

    useEffect(() => {
        const fetchServerInfo = async () => {
            const info = await getServerInfo(url);
            //console.log(info)
            if (info) {
                setServerInfo(info);
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
        <div className="w-full h-full bg-white flex flex-col">
            <TiledHeader handleExpandClick={()=>{}} isExpanded={false} secondaryTitle={url} showExpandButton={false}/>
            <section className="flex flex-col items-center space-y-8 mt-8 flex-shrink-0">
                <h2 className="text-slate-700 font-light text-lg">Please login to access Tiled</h2>
                <input 
                    className="w-72 h-10 pl-2 border border-slate-500" 
                    type="text" 
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input 
                    className="w-72 h-10 pl-2 border border-slate-500" 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    ref={passwordRef}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            attemptLogin();
                        }
                    }}
                />
                <Button  cb={attemptLogin} text="Login" disabled={!username || !password}/>
            </section>
            {warning && 
                <section className="flex items-center max-w-72 m-auto space-x-4 my-4 flex-shrink-0">
                    <Warning className="text-red-700 flex-shrink-0" size={32}/>
                    <p className="text-red-700 text-left text-sm">{warning}</p>
                </section>
            }
            <p className="text-slate-700 hover:text-slate-500 hover:cursor-pointer flex-shrink-0 mt-2 m-auto w-fit" onClick={() => setShowHelp(!showHelp)}>{showHelp ? 'hide server info' : 'help'}</p>
            {showHelp &&
            <section className="flex flex-col items-center mt-4 flex-grow overflow-y-auto w-3/4 max-w-5xl m-auto mb-4  bg-slate-100 rounded-sm">
                <div className="text-sm px-4 py-2">
                    <p>If you've reached this login form it indicates that the Tiled server has sent an authorization error to this client. Based on the information below, the Tiled server requires a username password combination to authenticate.</p>
                    <span className="flex items-center mt-4 space-x-2">
                        <Lock className="text-slate-800" size={24}/>
                        <p className="font-medium text-lg">Tiled Authentication Settings</p>
                    </span>
                    <pre className="pl-4">{serverInfo?.authentication && JSON.stringify(serverInfo.authentication, null, 2)}</pre>
                    <span className="flex items-center mt-4 space-x-2">
                        <Info className="text-slate-800" size={24}/>
                        <p className="font-medium text-lg">All Tiled Server Info</p>
                    </span>
                    <pre className="pl-4"> {JSON.stringify(serverInfo, null, 2)} </pre>
                </div>
            </section>
        }
        </div>
    )
}