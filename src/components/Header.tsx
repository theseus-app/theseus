import { StudyDTO } from "@/type/dtoBuilderType"
import { defaultDTO } from "@/utils/dtoBuilderHelper"

interface HeaderProps {
    setDto: React.Dispatch<React.SetStateAction<StudyDTO>>
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}
export default function Header(props: HeaderProps) {
    const { setDto, setOpen } = props
    return (
        <header className="flex items-center justify-between py-10">
            <div>
                <h1 className="text-2xl font-bold">Nocode Strategus</h1>
            </div>
            {/* <div className="flex gap-2">
                <button
                    className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDto(structuredClone(defaultDTO))}
                >
                    Reset
                </button>
 
            </div> */}
            <button
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                onClick={() => setOpen(true)}
            >
                SHOW JSON
            </button>
        </header>
    )
}