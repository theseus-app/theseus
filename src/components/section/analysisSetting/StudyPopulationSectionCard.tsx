import { DateInput, Field, NumInput, RowCard, SectionCard, Select, YesNoToggle } from "@/components/primitive";
import { observer } from "mobx-react-lite";
import { ArrayHeader } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";

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
                        studyPeriods: [...dto.getDbCohortMethodDataArgs.studyPeriods, { studyStartDate: "", studyEndDate: "" }],
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
                    checked={dto.createStudyPopArgs.restrictToCommonPeriod}
                    onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, restrictToCommonPeriod: v })} />
            </Field>
            <Field title="First Exposure Restriction" label="Should only the first exposure per subject be included?">
                <YesNoToggle
                    checked={dto.createStudyPopArgs.firstExposureOnly}
                    onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, firstExposureOnly: v })} />
            </Field>
            <Field title="Minimum Continuous Observation" label="The minimum required continuous observation time (in days) prior to index date for a person to be included in the cohort.">
                <div className="w-1/3">
                    <NumInput
                        value={dto.createStudyPopArgs.washoutPeriod}
                        onChange={(e) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, washoutPeriod: Number(e.target.value || 0) })}
                        min={0} />
                </div>
            </Field>
            <Field title="Remove Overlapping Subjects" label="Remove subjects that are in both the target and comparator cohort?">
                <div className="w-1/3">
                    <Select
                        value={dto.createStudyPopArgs.removeDuplicateSubjects}
                        onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, removeDuplicateSubjects: v })}
                        options={["keep all", "keep first", "remove all"]} />
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
            <Field label="priorOutcomeLookBack (number)">
                <NumInput
                    value={dto.createStudyPopArgs.priorOutcomeLookBack}
                    onChange={(e) => set("createStudyPopArgs", {
                        ...dto.createStudyPopArgs,
                        priorOutcomeLookBack: Number(e.target.value || 0),
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