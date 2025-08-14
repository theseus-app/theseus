export default function ArrayHeader({
  title,
  label,
  onAdd,
}: {
  title?: string;
  label?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1.5">
        {title && <h3 className="font-semibold text-base">{title}</h3>}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-sm px-3 py-1 rounded-lg bg-primary hover:opacity-70 text-white font-medium"
        >
          Add
        </button>
      )}
    </div>
  );
}
