"use client";
import React from "react";
import { ArrayHeader, Field, NumInput, RowCard, SectionCard, TextInput } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";


export default function CohortSettingSectionCard() {
    const { study } = useStore()
    const { dto, set } = study

    return (
        <SectionCard title="Cohort Settings">
            {/* Target Cohort */}
            <div>
                <ArrayHeader title="Target Cohort" />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Cohort ID">
                        <NumInput
                            value={dto.cohortDefinitions.targetCohort.id ?? ""}
                            onChange={(e) => set("cohortDefinitions", {
                                ...dto.cohortDefinitions,
                                targetCohort: {
                                    ...dto.cohortDefinitions.targetCohort,
                                    id: e.target.value === "" ? null : Number(e.target.value),
                                },
                            })}
                            placeholder="ATLAS Cohort ID" />
                    </Field>
                    <Field label="Cohort Name">
                        <TextInput
                            value={dto.cohortDefinitions.targetCohort.name}
                            onChange={(e) => set("cohortDefinitions", {
                                ...dto.cohortDefinitions,
                                targetCohort: { ...dto.cohortDefinitions.targetCohort, name: e.target.value },
                            })}
                            placeholder="ATLAS Cohort Name"
                        />
                    </Field>
                </div>
            </div>

            {/* Comparator Cohort */}
            <div className="mb-10">
                <ArrayHeader title="Comparator Cohort" />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Cohort ID">
                        <NumInput
                            value={dto.cohortDefinitions.comparatorCohort.id ?? ""}
                            onChange={(e) => set("cohortDefinitions", {
                                ...dto.cohortDefinitions,
                                comparatorCohort: {
                                    ...dto.cohortDefinitions.comparatorCohort,
                                    id: e.target.value === "" ? null : Number(e.target.value),
                                },
                            })}
                            placeholder="ATLAS Cohort ID" />
                    </Field>
                    <Field label="Cohort Name">
                        <TextInput
                            value={dto.cohortDefinitions.comparatorCohort.name}
                            onChange={(e) => set("cohortDefinitions", {
                                ...dto.cohortDefinitions,
                                comparatorCohort: { ...dto.cohortDefinitions.comparatorCohort, name: e.target.value },
                            })}
                            placeholder="ATLAS Cohort Name"
                        />
                    </Field>
                </div>
            </div>

            {/* Outcome Cohort */}
            <div className="space-y-2">
                <ArrayHeader
                    title="Outcome Cohort"
                    onAdd={() => set("cohortDefinitions", {
                        ...dto.cohortDefinitions,
                        outcomeCohort: [...dto.cohortDefinitions.outcomeCohort, { id: null, name: "Outcome Cohort Name" }],
                    })} />
                <div className="space-y-3">
                    {dto.cohortDefinitions.outcomeCohort.map((oc, idx) => (
                        <RowCard
                            key={idx}
                            onRemove={() => set("cohortDefinitions", {
                                ...dto.cohortDefinitions,
                                outcomeCohort: dto.cohortDefinitions.outcomeCohort.filter((_, i) => i !== idx),
                            })}
                        >
                            <Field label={`Cohort ID`}>
                                <NumInput
                                    value={oc.id ?? ""}
                                    onChange={(e) => {
                                        const v = e.target.value === "" ? null : Number(e.target.value);
                                        const arr = [...dto.cohortDefinitions.outcomeCohort];
                                        arr[idx] = { ...arr[idx], id: v };
                                        set("cohortDefinitions", { ...dto.cohortDefinitions, outcomeCohort: arr });
                                    }}
                                    placeholder="ATLAS Cohort ID"
                                />
                            </Field>
                            <Field label={`Cohort Name`}>
                                <TextInput
                                    value={oc.name}
                                    onChange={(e) => {
                                        const arr = [...dto.cohortDefinitions.outcomeCohort];
                                        arr[idx] = { ...arr[idx], name: e.target.value };
                                        set("cohortDefinitions", { ...dto.cohortDefinitions, outcomeCohort: arr });
                                    }}
                                    placeholder="ATLAS Cohort Name"
                                />
                            </Field>
                        </RowCard>
                    ))}
                </div>
            </div>
        </SectionCard>
    )


}