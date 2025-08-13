export default function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: T[] }) {
    return (
        <select
            className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
            value={value}
            onChange={(e) => onChange(e.target.value as T)}
        >
            {options.map((op) => (
                <option key={op} value={op}>
                    {op}
                </option>
            ))}
        </select>
    );
}
