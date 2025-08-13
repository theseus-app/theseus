import { useState } from "react";

export default function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="border rounded-2xl p-4 bg-white shadow-sm">
            <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setOpen((o) => !o)}
            >
                <h2 className="text-lg font-semibold">{title}</h2>
                <span className="text-sm opacity-70">{open ? "▾" : "▸"}</span>
            </button>
            {open && <div className="mt-4 space-y-3">{children}</div>}
        </div>
    );
}