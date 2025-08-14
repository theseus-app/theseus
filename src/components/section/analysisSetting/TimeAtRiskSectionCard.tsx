import { ArrayHeader, Field, NumInput, RowCard, SectionCard, Select, TextInput } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { Anchor } from "@/type/dtoBuilderType";
import { observer } from "mobx-react-lite";

function TimeAtRiskSectionCard() {
    const { study } = useStore()
    const { set, dto } = study
    return (
        <SectionCard title="Time At Risk">
            <ArrayHeader title="Time At Risk"
                onAdd={() => set("createStudyPopArgs", {
                    ...dto.createStudyPopArgs,
                    timeAtRisks: [...dto.createStudyPopArgs.timeAtRisks, { description: "", riskWindowStart: 0, startAnchor: 'cohort start', riskWindowEnd: 0, endAnchor: 'cohort end', minDaysAtRisk: 1 }],
                })} />
            {dto.createStudyPopArgs.timeAtRisks.map((t, i) => (
                <RowCard
                    key={i}
                    onRemove={() => set("createStudyPopArgs", {
                        ...dto.createStudyPopArgs,
                        timeAtRisks: dto.createStudyPopArgs.timeAtRisks.filter((_, k) => k !== i),
                    })}
                    oneColumn
                >
                    <Field label={`Description`}>
                        <TextInput
                            value={t.description}
                            onChange={(e) => {
                                const arr = [...dto.createStudyPopArgs.timeAtRisks];
                                arr[i] = { ...arr[i], description: e.target.value };
                                set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                            }}
                            placeholder="Type Description"
                        />
                    </Field>
                    <Field title="Time-at-risk Start" label="Define the time-at-risk window start, relative to target/comparator cohort entry:">
                        <div className="flex gap-2 items-center">
                            <span className="flex">
                                <NumInput
                                    value={t.riskWindowStart}
                                    onChange={(e) => {
                                        const arr = [...dto.createStudyPopArgs.timeAtRisks];
                                        arr[i] = { ...arr[i], riskWindowStart: Number(e.target.value || 0) };
                                        set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                                    }} />
                            </span>
                            <span className="flex ">days from</span>
                            <span className="flex flex-1">
                                <Select
                                    value={t.startAnchor}
                                    onChange={(v: Anchor) => {
                                        const arr = [...dto.createStudyPopArgs.timeAtRisks];
                                        arr[i] = { ...arr[i], startAnchor: v };
                                        set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                                    }}
                                    options={["cohort start", "cohort end"]} />
                            </span>
                        </div>
                    </Field>

                    <Field title="Time-at-risk End" label="Define the time-at-risk window end:">
                        <div className="flex gap-2 items-center">
                            <span className="flex">
                                <NumInput
                                    value={t.riskWindowEnd}
                                    onChange={(e) => {
                                        const arr = [...dto.createStudyPopArgs.timeAtRisks];
                                        arr[i] = { ...arr[i], riskWindowEnd: Number(e.target.value || 0) };
                                        set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                                    }}
                                />
                            </span>
                            <span className="flex">days from</span>
                            <span className="flex flex-1">
                                <Select
                                    value={t.endAnchor}
                                    onChange={(v: Anchor) => {
                                        const arr = [...dto.createStudyPopArgs.timeAtRisks];
                                        arr[i] = { ...arr[i], endAnchor: v };
                                        set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                                    }}
                                    options={["cohort start", "cohort end"]}
                                />
                            </span>
                        </div>
                    </Field>

                    <Field title="Minimum Days at Risk" label="The minimum number of days at risk?">
                        <NumInput
                            value={t.minDaysAtRisk}
                            onChange={(e) => {
                                const arr = [...dto.createStudyPopArgs.timeAtRisks];
                                arr[i] = { ...arr[i], minDaysAtRisk: Number(e.target.value || 0) };
                                set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                            }}
                            min={0} />
                    </Field>
                </RowCard>
            ))}
        </SectionCard>
    )

}

export default observer(TimeAtRiskSectionCard)