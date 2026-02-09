type MaintenanceOverlayProps = {
    title?: string;
    message?: string;
};

export function MaintenanceOverlay({
    title = "維護更新中",
    message = "此功能暫時不予開放，敬請期待"
}: MaintenanceOverlayProps) {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-slate-900/98 via-slate-900/95 to-slate-900/90 backdrop-blur-[3px]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 mb-4 animate-pulse">
                <span className="text-4xl">🔧</span>
            </div>
            <p className="text-xl font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm text-white/60">{message}</p>
        </div>
    );
}
