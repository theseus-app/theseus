export default function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-[92vw] max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <h3 className="font-semibold">Confirm JSON</h3>
                    <button className="text-sm" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="p-4 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}