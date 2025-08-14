export default function Field({
    title,
    label,
    children,
}: {
    title?: string;
    label?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2.5">
            <div className="gap-1.5">
                {title && <h3 className="font-semibold text-base">{title}</h3>}
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            {children}
        </div>
    );
}
