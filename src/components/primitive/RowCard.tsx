export default function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
    return (
        <div className="rounded-xl border p-3 bg-gray-50/60">
            <div className="flex justify-end">
                {onRemove && (
                    <button type="button" className="text-xs text-red-600" onClick={onRemove}>
                        Remove
                    </button>
                )}
            </div>
            <div className="grid md:grid-cols-2 gap-3">{children}</div>
        </div>
    );
}