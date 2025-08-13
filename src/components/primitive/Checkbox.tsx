export default function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            {label && <span className="select-none text-sm">{label}</span>}
        </div>
    );
}