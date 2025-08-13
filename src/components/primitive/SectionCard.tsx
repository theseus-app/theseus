import { useState } from "react";

export default function SectionCard({
    title,
    children,
    noToggle,
    topGroup
}: {
    title: string;
    children: React.ReactNode;
    noToggle?: boolean;
    topGroup?: boolean;
}) {
    const [open, setOpen] = useState(true);
    const collapsible = !noToggle;

    return (
        <div className={`border-[0.5px] ${topGroup ? 'border-lightgray' : 'border-primary'} rounded-[2px] bg-white shadow-sm`}>
            {collapsible ? (
                <button
                    type="button"
                    className={`${topGroup ? 'text-black bg-lightgray' : 'text-white bg-primary'} w-full flex items-center justify-between text-left px-4 py-3`}
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                >
                    <h2 className={`text-lg font-semibold`}>{title}</h2>
                    <span className="text-lg select-none" aria-hidden>
                        {open ? "▾" : "▸"}
                    </span>
                </button>
            ) : (
                <div className="px-4 py-3">
                    <h2 className={` ${topGroup ? 'text-black' : 'text-white'} text-lg font-semibold`}>{title}</h2>
                </div>
            )}

            {(collapsible ? open : true) && (
                <div className={`${topGroup ? 'px-6 pb-6' : 'px-4 pb-6'}`}>
                    <div className="mt-2 space-y-3">{children}</div>
                </div>
            )}
        </div>
    );
}
