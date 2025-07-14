import { ArrayStructure, TableStructure, TiledSearchItem } from "./types";
import ButtonCopyToClipboard from "../ButtonCopyToClipboard";

type TiledPreviewMetadataProps = {
    item: TiledSearchItem<ArrayStructure> | TiledSearchItem<TableStructure> ;
}
export default function TiledPreviewMetadata({
    item,
    ...props
}: TiledPreviewMetadataProps) {

    const linkKeys:string[] = Object.keys(item.links);
    const onPopoutClick =(e:React.MouseEvent<HTMLAnchorElement>, popoutUrl:string | undefined) => {
        e.preventDefault();
        //open a new tab with the specified URL
        if (popoutUrl) {
            window.open(popoutUrl, '_blank', 'noopener,noreferrer');
        }
    };
    return (
        <div {...props}>

            <h3 className="m-auto text-left pl-4 text-sky-950">Links</h3>
            <ul className="flex w-full justify-start pl-8 space-x-6">
                {linkKeys.map((key:string) => {
                    var value = item.links[key as keyof typeof item.links];
                    if (typeof value !== "string") return null;
                    return (
                        <li key={key} className="flex space-x-1 text-sm">
                            <ButtonCopyToClipboard copyText={value} size="small"/>
                            <a onClick={e => onPopoutClick(e, value)} className="text-blue-600 underline hover:text-blue-500" href={item.links[key as keyof typeof item.links]}>{key}</a>
                        </li>
                    )
                })}
            </ul>

            <h3 className="m-auto text-left pl-4 mt-2 text-sky-950">Metadata</h3>
            <div className="px-8 max-w-[400px]" {...props}>
                <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap break-words">{JSON.stringify(item, null, 2)}</pre>
            </div>

        </div>
    )
}