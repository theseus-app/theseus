import { ArrayHeader, Field, NumInput, SectionCard, TextInput } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";

function NegativeControlSectionCard() {
    const { study } = useStore()
    const { dto, set } = study
    return (
        <SectionCard title="Negative Control Concept Set">
            <div className="">
                <ArrayHeader title="Negative Control Concept Set" />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Concept Set ID">
                        <NumInput
                            value={dto.negativeControlConceptSet.id ?? ""}
                            onChange={(e) => set("negativeControlConceptSet", {
                                ...dto.negativeControlConceptSet,
                                id: e.target.value === "" ? null : Number(e.target.value),
                            })}
                            placeholder="ATLAS Concept Set ID"
                        />
                    </Field>
                    <Field label="Concept Set Name">
                        <TextInput
                            value={dto.negativeControlConceptSet.name}
                            onChange={(e) => set("negativeControlConceptSet", { ...dto.negativeControlConceptSet, name: e.target.value })}
                            placeholder="ATLAS Concept Set Name"
                        />
                    </Field>
                </div>
            </div>

        </SectionCard>

    )
}

export default observer(NegativeControlSectionCard)