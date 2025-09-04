export interface PlotSettingsRowProps {
    label: string;
    children?: React.ReactNode;
}

export default function PlotSettingsRow({label, children}: PlotSettingsRowProps) {
    return (
        <span className="w-full flex pl-8">
            <p className="w-32 flex-shrink-0 font-medium">{label}</p>
            <div className="flex-grow text-xs">{children}</div>
        </span>
    )
}