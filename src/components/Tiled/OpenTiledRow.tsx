import ButtonCopyToClipboard from "../ButtonCopyToClipboard";
import { TiledItemLinks } from "./types";

export interface OpenTiledRowProps {
    userInputApiKey: string | undefined;
    setIsViewerOpen: (isOpen: boolean) => void;
    buttonModeText: string;
    selectedData: TiledItemLinks | null;
    handleInputChange: (value: string) => void;
}
export default function OpenTiledRow({userInputApiKey, setIsViewerOpen, buttonModeText, selectedData, handleInputChange}: OpenTiledRowProps) {

    return (
        <span className="flex gap-2 items-center">
            <label htmlFor="apikey" className="text-gray-700 text-sm flex items-center">API Key:</label>
            <input
                type="text"
                className="border border-gray-300 rounded-md px-2 py-1 h-fit"
                placeholder="Enter API Key (optional)"
                value={userInputApiKey || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                name="apikey"
            />
            <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-2 py-1 h-fit ml-4" onClick={()=>setIsViewerOpen(true)}>{buttonModeText}</button>
            <p className=" text-black text-nowrap overflow-x-auto max-w-72 min-w-36 w-fit bg-white hover:cursor-text px-1 py-1">{selectedData && selectedData.self.split("/").pop()}</p>
            <ButtonCopyToClipboard size="small" copyText={selectedData ? selectedData.self : ''} />
        </span>   
    )
}