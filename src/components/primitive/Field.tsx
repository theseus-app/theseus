export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {children}
        </label>
    );
}