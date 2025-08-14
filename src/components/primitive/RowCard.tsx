export default function RowCard({ children, onRemove, oneColumn }: { children: React.ReactNode; onRemove?: () => void, oneColumn?: boolean }) {
    return (
        <div className="rounded-xl p-4 bg-gray-100">
            <div className="flex justify-end">
                {onRemove && (
                    <button type="button" className="text-sm text-red-600 font-medium" onClick={onRemove}>
                        Remove
                    </button>
                )}
            </div>
            <div className={`${oneColumn?'flex flex-col': 'grid grid-cols-2'} gap-3`}>{children}</div>
        </div >
    );
}