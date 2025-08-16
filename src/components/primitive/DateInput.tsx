import { fromHtmlDate, toHtmlDate } from "@/utils/dtoBuilderHelper";

export default function DateInput({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
    return (
        <input
            type="date"
            lang="en"
            className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
            value={toHtmlDate(value)}
            onChange={(e) => onChange(fromHtmlDate(e.target.value))}
        />
    );
}