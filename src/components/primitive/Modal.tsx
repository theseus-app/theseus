export default function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-[12px] shadow-2xl max-w-4xl w-[92vw] max-h-[80vh] overflow-y-auto">
                <div className="p-4 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}