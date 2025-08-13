export default function ArrayHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
    return (
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">{title}</h3>
            {onAdd && (
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
                >
                    + Add
                </button>
            )}
        </div>
    );
}