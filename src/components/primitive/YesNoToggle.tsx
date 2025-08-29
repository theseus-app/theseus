export default function YesNoToggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            {label && <span className="select-none text-sm">{label}</span>}
            <div className="flex gap-2">
                {/* YES button */}
                <button
                    type="button"
                    className={`px-4 py-1.5 rounded-[4px] border text-sm font-medium ${checked
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    onClick={() => onChange(true)}
                >
                    Yes
                </button>

                {/* NO button */}
                <button
                    type="button"
                    className={`px-4 py-1.5 rounded-[4px] border text-sm font-medium ${!checked
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    onClick={() => onChange(false)}
                >
                    No
                </button>
            </div>
        </div>
    );
}
