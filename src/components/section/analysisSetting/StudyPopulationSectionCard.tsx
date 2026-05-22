import { DateInput, Field, NumInput, RowCard, SectionCard, Select, TextInput, YesNoToggle } from "@/components/primitive";
import { observer } from "mobx-react-lite";
import { ArrayHeader } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { RemoveDuplicate } from "@/types/dtoBuilderType";

function StudyPopulationSectionCard() {
    const { study } = useStore()
    const { set, dto } = study

    return (
        < SectionCard title="Study Population" >
            <div className="space-y-2">
                <ArrayHeader
                    title="Study Start & End Dates"
                    label="Set the cohort index date range. Leave blank to use all time."
                    onAdd={() => set("getDbCohortMethodDataArgs", {
                        ...dto.getDbCohortMethodDataArgs,
                        studyPeriods: [...dto.getDbCohortMethodDataArgs.studyPeriods, { description: "", studyStartDate: "", studyEndDate: "" }],
                    })} />
                <div className="space-y-3">
                    {dto.getDbCohortMethodDataArgs.studyPeriods.map((p, i) => (
                        <RowCard
                            key={i}
                            onRemove={() => set("getDbCohortMethodDataArgs", {
                                ...dto.getDbCohortMethodDataArgs,
                                studyPeriods: dto.getDbCohortMethodDataArgs.studyPeriods.filter((_, k) => k !== i),
                            })}
                        >
                            <Field label={`Description`}>
                                <TextInput
                                    value={p.description}
                                    onChange={(e) => {
                                        const arr = [...dto.getDbCohortMethodDataArgs.studyPeriods];
                                        arr[i] = { ...arr[i], description: e.target.value };
                                        set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, studyPeriods: arr });
                                    }}
                                    placeholder="Type Description"
                                />
                            </Field>
                            <Field label={`Study Start Date`}>
                                <DateInput
                                    value={p.studyStartDate}
                                    onChange={(v) => {
                                        const arr = [...dto.getDbCohortMethodDataArgs.studyPeriods];
                                        arr[i] = { ...arr[i], studyStartDate: v };
                                        set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, studyPeriods: arr });
                                    }} />
                            </Field>
                            <Field label={`Study End Date`}>
                                <DateInput
                                    value={p.studyEndDate}
                                    onChange={(v) => {
                                        const arr = [...dto.getDbCohortMethodDataArgs.studyPeriods];
                                        arr[i] = { ...arr[i], studyEndDate: v };
                                        set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, studyPeriods: arr });
                                    }} />
                            </Field>
                        </RowCard>
                    ))}
                </div>
            </div>

            <Field
                title="Restrict Study Period"
                label="Should the study be restricted to the period when both exposures are present? (E.g. when both drugs are on the market)"
            >
                <YesNoToggle
                    checked={dto.getDbCohortMethodDataArgs.restrictToCommonPeriod}
                    onChange={(v) => set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, restrictToCommonPeriod: v })} />
            </Field>
            <Field title="First Exposure Restriction" label="Should only the first exposure per subject be included?">
                <YesNoToggle
                    checked={dto.getDbCohortMethodDataArgs.firstExposureOnly}
                    onChange={(v) => set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, firstExposureOnly: v })} />
            </Field>
            <Field title="Minimum Continuous Observation" label="The minimum required continuous observation time (in days) prior to index date for a person to be included in the cohort.">
                <div className="w-1/3">
                    <NumInput
                        value={dto.getDbCohortMethodDataArgs.washoutPeriod}
                        onChange={(e) => set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, washoutPeriod: Number(e.target.value || 0) })}
                        min={0} />
                </div>
            </Field>
            <Field title="Remove Overlapping Subjects" label="Remove subjects that are in both the target and comparator cohort?">
                <div className="w-1/3">
                    <Select
                        value={dto.getDbCohortMethodDataArgs.removeDuplicateSubjects}
                        onChange={(v: RemoveDuplicate) => set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, removeDuplicateSubjects: v })}
                        options={["keep all", "keep first", "remove all", "keep first, truncate to second"]} />
                </div>
            </Field>
            <Field title="Censor Time-at-Risk on Overlap" label="If a subject is in multiple cohorts, should time-at-risk be censored when the new time-at-risk start to prevent overlap?">
                <YesNoToggle
                    checked={dto.createStudyPopArgs.censorAtNewRiskWindow}
                    onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, censorAtNewRiskWindow: v })} />
            </Field>
            <Field title="Remove Pre-Outcome Subjects" label="Remove subjects that have the outcome prior to the risk window start?">
                <YesNoToggle
                    checked={dto.createStudyPopArgs.removeSubjectsWithPriorOutcome}
                    onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, removeSubjectsWithPriorOutcome: v })} />
            </Field>
            <Field label="priorOutcomeLookback (number)">
                <NumInput
                    value={dto.createStudyPopArgs.priorOutcomeLookback}
                    onChange={(e) => set("createStudyPopArgs", {
                        ...dto.createStudyPopArgs,
                        priorOutcomeLookback: Number(e.target.value || 0),
                    })}
                    min={0} />
            </Field>
            <Field title="Maximum Cohort Size" label="If either the target or the comparator cohort is larger than this number it will be sampled to this size. (0 for this value indicates no maximum size)">
                <div className="w-1/3">
                    <NumInput
                        value={dto.getDbCohortMethodDataArgs.maxCohortSize}
                        onChange={(e) => set("getDbCohortMethodDataArgs", {
                            ...dto.getDbCohortMethodDataArgs,
                            maxCohortSize: Number(e.target.value || 0),
                        })}
                        min={0} />
                </div>
            </Field>

        </SectionCard >
    )
}

export default observer(StudyPopulationSectionCard)