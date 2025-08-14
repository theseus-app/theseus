import { ArrayHeader, Field, NumInput, RowCard, SectionCard, TextInput } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";

function CovariateSectionCard() {
    const { study } = useStore()
    const { set, dto } = study
    return (
        <SectionCard title="Covariate Selection">
            <div className="space-y-2">
                <ArrayHeader
                    title="Covariates - Concepts to Include (Leave blank to include all concepts)"
                    onAdd={() => set("covariateSelection", {
                        ...dto.covariateSelection,
                        conceptsToInclude: [...dto.covariateSelection.conceptsToInclude, { id: null, name: "" }],
                    })} />
                <div className="space-y-3">
                    {dto.covariateSelection.conceptsToInclude.map((c, i) => (
                        <RowCard
                            key={i}
                            onRemove={() => set("covariateSelection", {
                                ...dto.covariateSelection,
                                conceptsToInclude: dto.covariateSelection.conceptsToInclude.filter((_, k) => k !== i),
                            })}
                        >
                            <Field label={`Concept Set ID`}>
                                <NumInput
                                    value={c.id ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value === "" ? null : Number(e.target.value);
                                        const arr = [...dto.covariateSelection.conceptsToInclude];
                                        arr[i] = { ...arr[i], id: v };
                                        set("covariateSelection", { ...dto.covariateSelection, conceptsToInclude: arr });
                                    }}
                                    placeholder="ATLAS Concept Set ID"
                                />
                            </Field>
                            <Field label={`Concept Set Name`}>
                                <TextInput
                                    value={c.name}
                                    onChange={(e) => {
                                        const arr = [...dto.covariateSelection.conceptsToInclude];
                                        arr[i] = { ...arr[i], name: e.target.value };
                                        set("covariateSelection", { ...dto.covariateSelection, conceptsToInclude: arr });
                                    }}
                                    placeholder="ATLAS Concept Set Name"
                                />
                            </Field>
                        </RowCard>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <ArrayHeader
                    title="Covariates - Concepts to Exclude"
                    onAdd={() => set("covariateSelection", {
                        ...dto.covariateSelection,
                        conceptsToExclude: [...dto.covariateSelection.conceptsToExclude, { id: null, name: "" }],
                    })} />
                <div className="space-y-3">
                    {dto.covariateSelection.conceptsToExclude.map((c, i) => (
                        <RowCard
                            key={i}
                            onRemove={() => set("covariateSelection", {
                                ...dto.covariateSelection,
                                conceptsToExclude: dto.covariateSelection.conceptsToExclude.filter((_, k) => k !== i),
                            })}
                        >
                            <Field label={`Concept Set ID`}>
                                <NumInput
                                    value={c.id ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value === "" ? null : Number(e.target.value);
                                        const arr = [...dto.covariateSelection.conceptsToExclude];
                                        arr[i] = { ...arr[i], id: v };
                                        set("covariateSelection", { ...dto.covariateSelection, conceptsToExclude: arr });
                                    }}
                                    placeholder="ATLAS Concept Set ID"
                                />
                            </Field>
                            <Field label={`Concept Set Name`}>
                                <TextInput
                                    value={c.name}
                                    onChange={(e) => {
                                        const arr = [...dto.covariateSelection.conceptsToExclude];
                                        arr[i] = { ...arr[i], name: e.target.value };
                                        set("covariateSelection", { ...dto.covariateSelection, conceptsToExclude: arr });
                                    }}
                                    placeholder="ATLAS Concept Set Name"
                                />
                            </Field>
                        </RowCard>
                    ))}
                </div>
            </div>

        </SectionCard>
    )
}

export default observer(CovariateSectionCard)