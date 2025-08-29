import { useStore } from "@/stores/StoreProvider"

export default function Header() {
    const { study } = useStore()
    const { setOpen } = study;


    return (
        <header className="flex items-center justify-between py-10">
            <div>
                <h1 className="text-xl font-medium">THESEUS</h1>
            </div>
            <button
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                onClick={() => setOpen(true)}
            >
                SHOW JSON
            </button>
        </header>
    )
}