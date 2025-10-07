import Button from "../Button";
import { SpinnerGap, CircleNotch } from "@phosphor-icons/react";
import { TiledAuthProvider } from "./types";
export type LoginOIDCProps = {
    handleCancel: () => void;
    provider: TiledAuthProvider
}
export default function LoginOIDC({ handleCancel, provider }: LoginOIDCProps) {
    return (
        <section className="mt-8 flex flex-col items-center space-y-6">
            <h2 className="text-3xl text-slate-700 font-light">Waiting for you to authenticate</h2>
            <p>Please log in to the provider and return to this page when complete.</p>
            <CircleNotch className="text-slate-500 mt-4 animate-spin" size={72}/>
            <p className="w-full px-12 text-wrap">Having trouble finding the popup? Try going directly to <a className="text-blue-500 underline" href={provider.links.auth_endpoint} target="_blank" rel="noopener noreferrer">this link</a> in a new window.</p>
            <Button isSecondary={true} cb={handleCancel} text="Cancel" /> 
        </section>
    )
}