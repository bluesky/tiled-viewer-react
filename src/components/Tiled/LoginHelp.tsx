import { useState } from "react";

import { Lock, Info } from "@phosphor-icons/react";

export type LoginHelpProps = {
    serverInfo: {[key: string]: any} | null;
}
export default function LoginHelp({ serverInfo }: LoginHelpProps) {
    const [ showHelp, setShowHelp ] = useState<boolean>(false);
    
    return (
        <>
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
        </>
    )
}