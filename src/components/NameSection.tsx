import { StudyDTO } from "@/type/dtoBuilderType";
import { TextInput } from "./primitive";
interface NameSectionProps {
    dto: StudyDTO
    set: <K extends keyof StudyDTO>(key: K, value: StudyDTO[K]) => void

}
export default function NameSection(props: NameSectionProps) {
    const { dto, set } = props
    return (
        < div className="flex flex-col py-5 px-5 bg-gray text-white gap-5 rounded-t-[16px]" >
            <h2 className="text-lg font-semibold">New Population Level Estimation Analysis - Comparative Cohort Analysis </h2>
            <TextInput value={dto.name} onChange={(e) => set("name", e.target.value)} placeholder="Study Name" />
            <div className="mt-4"></div>
        </div >
    )
}