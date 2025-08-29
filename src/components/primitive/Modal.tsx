export default function Modal({
    open,
    onClose,
    children,
    keepMounted = true, //keep mount
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    keepMounted?: boolean;
}) {
    if (!keepMounted && !open) return null;

    return (
        <div
            className={`fixed inset-0 z-50 grid place-items-center transition-opacity duration-150
        ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!open}
            onMouseDown={(e) => {
                if (!open) return;
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={() => onClose()} />

            {/* Panel */}
            <div
                className={`relative bg-white rounded-[12px] shadow-2xl max-w-4xl w-[92vw] max-h-[80vh] overflow-y-auto
          transition-transform duration-150 ${open ? "scale-100" : "scale-95"}`}
            >
                <div className="p-4 overflow-auto">{children}</div>
            </div>
        </div>
    );
}
