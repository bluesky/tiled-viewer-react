import { TiledAuthProvider } from "./types";
import { Question } from "@phosphor-icons/react";

export type LoginSelectProviderProps = {
    handleClick: (provider: TiledAuthProvider) => void;
    providers: TiledAuthProvider[];
}

export default function LoginSelectProvider({ handleClick, providers }: LoginSelectProviderProps) {
    console.log({providers})
    return (
        <ul className="w-full flex justify-center flex-col mt-12 space-y-4 mb-4">
            <h2 className="text-center text-2xl text-slate-600 mb-4"> Select Login Provider </h2>
            {providers.map((provider) => (
                <li key={provider.provider} className="flex m-auto items-center space-x-2">
                    <button className="border border-slate-200 rounded-md w-72 min-w-fit text-lg py-1 hover:bg-slate-50 text-sky-700" onClick={() => handleClick(provider)}>
                        LOG IN WITH {provider.provider.toLocaleUpperCase()}
                    </button>
                    <Question size={24}/>
                </li>
            ))}
        </ul>
    );
}
