"use client";

import React, { useMemo, useState } from "react";

// =====================
// Types
// =====================

type Anchor = "cohort start" | "cohort end";
type RemoveDuplicate = "keep all" | "keep first" | "remove all";
type CaliperScale = "propensity score" | "standardized" | "standardized logit";
type BaseSelection = "all" | "target" | "comparator";
type ModelType = "logistic" | "poisson" | "cox";
type CvType = "auto" | "grid";
type NoiseLevel = "silent" | "quiet" | "noisy";

export type StudyDTO = {
  name: string;
  cohortDefinitions: {
    targetCohort: { id: number | null; name: string };
    comparatorCohort: { id: number | null; name: string };
    outcomeCohort: { id: number | null; name: string }[];
  };
  negativeControlConceptSet: { id: number | null; name: string };
  covariateSelection: {
    conceptsToInclude: { id: number | null; name: string }[];
    conceptsToExclude: { id: number | null; name: string }[];
  };
  getDbCohortMethodDataArgs: {
    studyPeriods: { studyStartDate: string; studyEndDate: string }[]; // yyyyMMdd
    maxCohortSize: number; // 0 = no limit
  };
  createStudyPopArgs: {
    restrictToCommonPeriod: boolean;
    firstExposureOnly: boolean;
    washoutPeriod: number;
    removeDuplicateSubjects: RemoveDuplicate;
    censorAtNewRiskWindow: boolean;
    removeSubjectsWithPriorOutcome: boolean;
    priorOutcomeLookBack: number;
    timeAtRisks: {
      description: string;
      riskWindowStart: number;
      startAnchor: Anchor;
      riskWindowEnd: number;
      endAnchor: Anchor;
      minDaysAtRisk: number;
    }[];
  };
  propensityScoreAdjustment: {
    matchOnPsArgs: {
      description: string;
      maxRatio: number; // 0 = no max
      caliper: number; // 0 = off
      caliperScale: CaliperScale;
    }[];
    stratifyByPsArgs: {
      description: string;
      numberOfStrata: number;
      baseSelection: BaseSelection;
    }[];
    createPsArgs: {
      maxCohortSizeForFitting: number; // 0 = no downsample
      errorOnHighCorrelation: boolean;
      prior: { priorType: "laplace"; useCrossValidation: boolean };
      control: {
        tolerance: number;
        cvType: CvType;
        fold: number;
        cvRepetitions: number;
        noiseLevel: NoiseLevel;
        resetCoefficients: boolean;
        startingVariance: number; // -1 = auto
      };
    };
  };
  fitOutcomeModelArgs: {
    modelType: ModelType;
    stratified: boolean;
    useCovariates: boolean;
    inversePtWeighting: boolean;
    prior: { priorType: "laplace"; useCrossValidation: boolean };
    control: {
      tolerance: number;
      cvType: CvType;
      fold: number;
      cvRepetitions: number;
      noiseLevel: NoiseLevel;
      resetCoefficients: boolean;
      startingVariance: number;
    };
  };
};

// =====================
// Helpers
// =====================

const yyyymmdd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

const fromHtmlDate = (val: string) => val.replaceAll("-", "");
const toHtmlDate = (yyyymmddStr: string) =>
  yyyymmddStr && yyyymmddStr.length === 8
    ? `${yyyymmddStr.slice(0, 4)}-${yyyymmddStr.slice(4, 6)}-${yyyymmddStr.slice(6, 8)}`
    : "";

const defaultDTO: StudyDTO = {
  name: "Study Name",
  cohortDefinitions: {
    targetCohort: { id: null, name: "Target Cohort Name" },
    comparatorCohort: { id: null, name: "Comparator Cohort Name" },
    outcomeCohort: [{ id: null, name: "Outcome Cohort Name" }],
  },
  negativeControlConceptSet: { id: null, name: "Negative Control Concept Set Name" },
  covariateSelection: {
    conceptsToInclude: [{ id: null, name: "Concept Name 1" }],
    conceptsToExclude: [{ id: null, name: "Concept Name 3" }],
  },
  getDbCohortMethodDataArgs: {
    studyPeriods: [
      {
        studyStartDate: yyyymmdd(new Date(new Date().getFullYear(), 0, 1)),
        studyEndDate: yyyymmdd(new Date()),
      },
    ],
    maxCohortSize: 0,
  },
  createStudyPopArgs: {
    restrictToCommonPeriod: false,
    firstExposureOnly: false,
    washoutPeriod: 0,
    removeDuplicateSubjects: "keep all",
    censorAtNewRiskWindow: false,
    removeSubjectsWithPriorOutcome: true,
    priorOutcomeLookBack: 99999,
    timeAtRisks: [
      {
        description: "TAR 1",
        riskWindowStart: 0,
        startAnchor: "cohort start",
        riskWindowEnd: 0,
        endAnchor: "cohort end",
        minDaysAtRisk: 1,
      },
    ],
  },
  propensityScoreAdjustment: {
    matchOnPsArgs: [
      { description: "PS 1", maxRatio: 1, caliper: 0.2, caliperScale: "standardized logit" },
    ],
    stratifyByPsArgs: [
      { description: "PS 2", numberOfStrata: 5, baseSelection: "all" },
    ],
    createPsArgs: {
      maxCohortSizeForFitting: 250000,
      errorOnHighCorrelation: true,
      prior: { priorType: "laplace", useCrossValidation: true },
      control: {
        tolerance: 2e-7,
        cvType: "auto",
        fold: 10,
        cvRepetitions: 10,
        noiseLevel: "silent",
        resetCoefficients: true,
        startingVariance: 0.01,
      },
    },
  },
  fitOutcomeModelArgs: {
    modelType: "cox",
    stratified: false,
    useCovariates: false,
    inversePtWeighting: false,
    prior: { priorType: "laplace", useCrossValidation: true },
    control: {
      tolerance: 2e-7,
      cvType: "auto",
      fold: 10,
      cvRepetitions: 10,
      noiseLevel: "quiet",
      resetCoefficients: true,
      startingVariance: 0.01,
    },
  },
};

// =====================
// UI Primitives
// =====================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm opacity-70">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type={props.type ?? "text"}
      className={
        "border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40 " +
        (props.className ?? "")
      }
    />
  );
}

function NumInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <TextInput {...props} type="number" inputMode="numeric" pattern="[0-9]*" />;
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label && <span className="select-none text-sm">{label}</span>}
    </div>
  );
}

function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: T[] }) {
  return (
    <select
      className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
      value={toHtmlDate(value)}
      onChange={(e) => onChange(fromHtmlDate(e.target.value))}
    />
  );
}

function ArrayHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-base">{title}</h3>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
        >
          + Add
        </button>
      )}
    </div>
  );
}

function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="rounded-xl border p-3 bg-gray-50/60">
      <div className="flex justify-end">
        {onRemove && (
          <button type="button" className="text-xs text-red-600" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-[92vw] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="font-semibold">Confirm JSON</h3>
          <button className="text-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// =====================
// Main Component
// =====================

export default function StudyBuilderPage() {
  const [dto, setDto] = useState<StudyDTO>(() => structuredClone(defaultDTO));
  const [open, setOpen] = useState(false);

  const set = <K extends keyof StudyDTO>(key: K, value: StudyDTO[K]) => setDto({ ...dto, [key]: value });

  const jsonPretty = useMemo(() => JSON.stringify(dto, null, 2), [dto]);

  const copy = async () => {
    await navigator.clipboard.writeText(jsonPretty);
    alert("JSON copied to clipboard");
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nocode Strategus</h1>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
              onClick={() => setDto(structuredClone(defaultDTO))}
            >
              Reset
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setOpen(true)}
            >
             Show JSON
            </button>
          </div>
        </header>

        {/* name */}
        <Section title="Study Name">
          <Field label="name (string)">
            <TextInput value={dto.name} onChange={(e) => set("name", e.target.value)} placeholder="Study Name" />
          </Field>
        </Section>

        {/* cohortDefinitions */}
        <Section title="Cohort Definitions">
          <ArrayHeader title="Target Cohort" />
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="targetCohort.id (number|null)">
              <NumInput
                value={dto.cohortDefinitions.targetCohort.id ?? ""}
                onChange={(e) =>
                  set("cohortDefinitions", {
                    ...dto.cohortDefinitions,
                    targetCohort: {
                      ...dto.cohortDefinitions.targetCohort,
                      id: e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="ATLAS Cohort ID"
              />
            </Field>
            <Field label="targetCohort.name (string)">
              <TextInput
                value={dto.cohortDefinitions.targetCohort.name}
                onChange={(e) =>
                  set("cohortDefinitions", {
                    ...dto.cohortDefinitions,
                    targetCohort: { ...dto.cohortDefinitions.targetCohort, name: e.target.value },
                  })
                }
              />
            </Field>

            <Field label="comparatorCohort.id (number|null)">
              <NumInput
                value={dto.cohortDefinitions.comparatorCohort.id ?? ""}
                onChange={(e) =>
                  set("cohortDefinitions", {
                    ...dto.cohortDefinitions,
                    comparatorCohort: {
                      ...dto.cohortDefinitions.comparatorCohort,
                      id: e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="ATLAS Cohort ID"
              />
            </Field>
            <Field label="comparatorCohort.name (string)">
              <TextInput
                value={dto.cohortDefinitions.comparatorCohort.name}
                onChange={(e) =>
                  set("cohortDefinitions", {
                    ...dto.cohortDefinitions,
                    comparatorCohort: { ...dto.cohortDefinitions.comparatorCohort, name: e.target.value },
                  })
                }
              />
            </Field>
          </div>

          <ArrayHeader
            title="outcomeCohort (array)"
            onAdd={() =>
              set("cohortDefinitions", {
                ...dto.cohortDefinitions,
                outcomeCohort: [...dto.cohortDefinitions.outcomeCohort, { id: null, name: "Outcome Cohort Name" }],
              })
            }
          />
          <div className="space-y-3">
            {dto.cohortDefinitions.outcomeCohort.map((oc, idx) => (
              <RowCard
                key={idx}
                onRemove={() =>
                  set("cohortDefinitions", {
                    ...dto.cohortDefinitions,
                    outcomeCohort: dto.cohortDefinitions.outcomeCohort.filter((_, i) => i !== idx),
                  })
                }
              >
                <Field label={`outcomeCohort[${idx}].id (number|null)`}>
                  <NumInput
                    value={oc.id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      const arr = [...dto.cohortDefinitions.outcomeCohort];
                      arr[idx] = { ...arr[idx], id: v };
                      set("cohortDefinitions", { ...dto.cohortDefinitions, outcomeCohort: arr });
                    }}
                  />
                </Field>
                <Field label={`outcomeCohort[${idx}].name (string)`}>
                  <TextInput
                    value={oc.name}
                    onChange={(e) => {
                      const arr = [...dto.cohortDefinitions.outcomeCohort];
                      arr[idx] = { ...arr[idx], name: e.target.value };
                      set("cohortDefinitions", { ...dto.cohortDefinitions, outcomeCohort: arr });
                    }}
                  />
                </Field>
              </RowCard>
            ))}
          </div>
        </Section>

        {/* negativeControlConceptSet & covariateSelection */}
        <Section title="Concept Sets">
          <ArrayHeader title="Negative Control Concept Set" />
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="negativeControlConceptSet.id (number|null)">
              <NumInput
                value={dto.negativeControlConceptSet.id ?? ""}
                onChange={(e) =>
                  set("negativeControlConceptSet", {
                    ...dto.negativeControlConceptSet,
                    id: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="negativeControlConceptSet.name (string)">
              <TextInput
                value={dto.negativeControlConceptSet.name}
                onChange={(e) => set("negativeControlConceptSet", { ...dto.negativeControlConceptSet, name: e.target.value })}
              />
            </Field>
          </div>

          <ArrayHeader
            title="covariateSelection.conceptsToInclude (array)"
            onAdd={() =>
              set("covariateSelection", {
                ...dto.covariateSelection,
                conceptsToInclude: [...dto.covariateSelection.conceptsToInclude, { id: null, name: "" }],
              })
            }
          />
          <div className="space-y-3">
            {dto.covariateSelection.conceptsToInclude.map((c, i) => (
              <RowCard
                key={i}
                onRemove={() =>
                  set("covariateSelection", {
                    ...dto.covariateSelection,
                    conceptsToInclude: dto.covariateSelection.conceptsToInclude.filter((_, k) => k !== i),
                  })
                }
              >
                <Field label={`conceptsToInclude[${i}].id (number|null)`}>
                  <NumInput
                    value={c.id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      const arr = [...dto.covariateSelection.conceptsToInclude];
                      arr[i] = { ...arr[i], id: v };
                      set("covariateSelection", { ...dto.covariateSelection, conceptsToInclude: arr });
                    }}
                  />
                </Field>
                <Field label={`conceptsToInclude[${i}].name (string)`}>
                  <TextInput
                    value={c.name}
                    onChange={(e) => {
                      const arr = [...dto.covariateSelection.conceptsToInclude];
                      arr[i] = { ...arr[i], name: e.target.value };
                      set("covariateSelection", { ...dto.covariateSelection, conceptsToInclude: arr });
                    }}
                  />
                </Field>
              </RowCard>
            ))}
          </div>

          <ArrayHeader
            title="covariateSelection.conceptsToExclude (array)"
            onAdd={() =>
              set("covariateSelection", {
                ...dto.covariateSelection,
                conceptsToExclude: [...dto.covariateSelection.conceptsToExclude, { id: null, name: "" }],
              })
            }
          />
          <div className="space-y-3">
            {dto.covariateSelection.conceptsToExclude.map((c, i) => (
              <RowCard
                key={i}
                onRemove={() =>
                  set("covariateSelection", {
                    ...dto.covariateSelection,
                    conceptsToExclude: dto.covariateSelection.conceptsToExclude.filter((_, k) => k !== i),
                  })
                }
              >
                <Field label={`conceptsToExclude[${i}].id (number|null)`}>
                  <NumInput
                    value={c.id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      const arr = [...dto.covariateSelection.conceptsToExclude];
                      arr[i] = { ...arr[i], id: v };
                      set("covariateSelection", { ...dto.covariateSelection, conceptsToExclude: arr });
                    }}
                  />
                </Field>
                <Field label={`conceptsToExclude[${i}].name (string)`}>
                  <TextInput
                    value={c.name}
                    onChange={(e) => {
                      const arr = [...dto.covariateSelection.conceptsToExclude];
                      arr[i] = { ...arr[i], name: e.target.value };
                      set("covariateSelection", { ...dto.covariateSelection, conceptsToExclude: arr });
                    }}
                  />
                </Field>
              </RowCard>
            ))}
          </div>
        </Section>

        {/* getDbCohortMethodDataArgs */}
        <Section title="getDbCohortMethodDataArgs">
          <Field label="maxCohortSize (number)">
            <NumInput
              value={dto.getDbCohortMethodDataArgs.maxCohortSize}
              onChange={(e) =>
                set("getDbCohortMethodDataArgs", {
                  ...dto.getDbCohortMethodDataArgs,
                  maxCohortSize: Number(e.target.value || 0),
                })
              }
              min={0}
            />
          </Field>

          <ArrayHeader
            title="studyPeriods (array)"
            onAdd={() =>
              set("getDbCohortMethodDataArgs", {
                ...dto.getDbCohortMethodDataArgs,
                studyPeriods: [...dto.getDbCohortMethodDataArgs.studyPeriods, { studyStartDate: "", studyEndDate: "" }],
              })
            }
          />
          <div className="space-y-3">
            {dto.getDbCohortMethodDataArgs.studyPeriods.map((p, i) => (
              <RowCard
                key={i}
                onRemove={() =>
                  set("getDbCohortMethodDataArgs", {
                    ...dto.getDbCohortMethodDataArgs,
                    studyPeriods: dto.getDbCohortMethodDataArgs.studyPeriods.filter((_, k) => k !== i),
                  })
                }
              >
                <Field label={`studyPeriods[${i}].studyStartDate (yyyyMMdd)`}>
                  <DateInput
                    value={p.studyStartDate}
                    onChange={(v) => {
                      const arr = [...dto.getDbCohortMethodDataArgs.studyPeriods];
                      arr[i] = { ...arr[i], studyStartDate: v };
                      set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, studyPeriods: arr });
                    }}
                  />
                </Field>
                <Field label={`studyPeriods[${i}].studyEndDate (yyyyMMdd)`}>
                  <DateInput
                    value={p.studyEndDate}
                    onChange={(v) => {
                      const arr = [...dto.getDbCohortMethodDataArgs.studyPeriods];
                      arr[i] = { ...arr[i], studyEndDate: v };
                      set("getDbCohortMethodDataArgs", { ...dto.getDbCohortMethodDataArgs, studyPeriods: arr });
                    }}
                  />
                </Field>
              </RowCard>
            ))}
          </div>
        </Section>

        {/* createStudyPopArgs */}
        <Section title="createStudyPopArgs">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="restrictToCommonPeriod (boolean)">
              <Checkbox
                checked={dto.createStudyPopArgs.restrictToCommonPeriod}
                onChange={(v) =>
                  set("createStudyPopArgs", { ...dto.createStudyPopArgs, restrictToCommonPeriod: v })
                }
              />
            </Field>
            <Field label="firstExposureOnly (boolean)">
              <Checkbox
                checked={dto.createStudyPopArgs.firstExposureOnly}
                onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, firstExposureOnly: v })}
              />
            </Field>
            <Field label="washoutPeriod (number)">
              <NumInput
                value={dto.createStudyPopArgs.washoutPeriod}
                onChange={(e) =>
                  set("createStudyPopArgs", { ...dto.createStudyPopArgs, washoutPeriod: Number(e.target.value || 0) })
                }
                min={0}
              />
            </Field>
            <Field label="removeDuplicateSubjects (enum)">
              <Select
                value={dto.createStudyPopArgs.removeDuplicateSubjects}
                onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, removeDuplicateSubjects: v })}
                options={["keep all", "keep first", "remove all"]}
              />
            </Field>
            <Field label="censorAtNewRiskWindow (boolean)">
              <Checkbox
                checked={dto.createStudyPopArgs.censorAtNewRiskWindow}
                onChange={(v) => set("createStudyPopArgs", { ...dto.createStudyPopArgs, censorAtNewRiskWindow: v })}
              />
            </Field>
            <Field label="removeSubjectsWithPriorOutcome (boolean)">
              <Checkbox
                checked={dto.createStudyPopArgs.removeSubjectsWithPriorOutcome}
                onChange={(v) =>
                  set("createStudyPopArgs", { ...dto.createStudyPopArgs, removeSubjectsWithPriorOutcome: v })
                }
              />
            </Field>
            <Field label="priorOutcomeLookBack (number)">
              <NumInput
                value={dto.createStudyPopArgs.priorOutcomeLookBack}
                onChange={(e) =>
                  set("createStudyPopArgs", {
                    ...dto.createStudyPopArgs,
                    priorOutcomeLookBack: Number(e.target.value || 0),
                  })
                }
                min={0}
              />
            </Field>
          </div>

          <ArrayHeader
            title="timeAtRisks (array)"
            onAdd={() =>
              set("createStudyPopArgs", {
                ...dto.createStudyPopArgs,
                timeAtRisks: [
                  ...dto.createStudyPopArgs.timeAtRisks,
                  {
                    description: "",
                    riskWindowStart: 0,
                    startAnchor: "cohort start",
                    riskWindowEnd: 0,
                    endAnchor: "cohort end",
                    minDaysAtRisk: 1,
                  },
                ],
              })
            }
          />
          <div className="space-y-3">
            {dto.createStudyPopArgs.timeAtRisks.map((t, i) => (
              <RowCard
                key={i}
                onRemove={() =>
                  set("createStudyPopArgs", {
                    ...dto.createStudyPopArgs,
                    timeAtRisks: dto.createStudyPopArgs.timeAtRisks.filter((_, k) => k !== i),
                  })
                }
              >
                <Field label={`timeAtRisks[${i}].description (string)`}>
                  <TextInput
                    value={t.description}
                    onChange={(e) => {
                      const arr = [...dto.createStudyPopArgs.timeAtRisks];
                      arr[i] = { ...arr[i], description: e.target.value };
                      set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                    }}
                  />
                </Field>
                <Field label={`timeAtRisks[${i}].riskWindowStart (number)`}>
                  <NumInput
                    value={t.riskWindowStart}
                    onChange={(e) => {
                      const arr = [...dto.createStudyPopArgs.timeAtRisks];
                      arr[i] = { ...arr[i], riskWindowStart: Number(e.target.value || 0) };
                      set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                    }}
                  />
                </Field>
                <Field label={`timeAtRisks[${i}].startAnchor (enum)`}>
                  <Select
                    value={t.startAnchor}
                    onChange={(v: Anchor) => {
                      const arr = [...dto.createStudyPopArgs.timeAtRisks];
                      arr[i] = { ...arr[i], startAnchor: v };
                      set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                    }}
                    options={["cohort start", "cohort end"]}
                  />
                </Field>
                <Field label={`timeAtRisks[${i}].riskWindowEnd (number)`}>
                  <NumInput
                    value={t.riskWindowEnd}
                    onChange={(e) => {
                      const arr = [...dto.createStudyPopArgs.timeAtRisks];
                      arr[i] = { ...arr[i], riskWindowEnd: Number(e.target.value || 0) };
                      set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                    }}
                  />
                </Field>
                <Field label={`timeAtRisks[${i}].endAnchor (enum)`}>
                  <Select
                    value={t.endAnchor}
                    onChange={(v: Anchor) => {
                      const arr = [...dto.createStudyPopArgs.timeAtRisks];
                      arr[i] = { ...arr[i], endAnchor: v };
                      set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                    }}
                    options={["cohort start", "cohort end"]}
                  />
                </Field>
                <Field label={`timeAtRisks[${i}].minDaysAtRisk (number)`}>
                  <NumInput
                    value={t.minDaysAtRisk}
                    onChange={(e) => {
                      const arr = [...dto.createStudyPopArgs.timeAtRisks];
                      arr[i] = { ...arr[i], minDaysAtRisk: Number(e.target.value || 0) };
                      set("createStudyPopArgs", { ...dto.createStudyPopArgs, timeAtRisks: arr });
                    }}
                    min={0}
                  />
                </Field>
              </RowCard>
            ))}
          </div>
        </Section>

        {/* propensityScoreAdjustment */}
        <Section title="propensityScoreAdjustment">
          <ArrayHeader
            title="matchOnPsArgs (array)"
            onAdd={() =>
              set("propensityScoreAdjustment", {
                ...dto.propensityScoreAdjustment,
                matchOnPsArgs: [
                  ...dto.propensityScoreAdjustment.matchOnPsArgs,
                  { description: "", maxRatio: 1, caliper: 0, caliperScale: "propensity score" },
                ],
              })
            }
          />
          <div className="space-y-3">
            {dto.propensityScoreAdjustment.matchOnPsArgs.map((m, i) => (
              <RowCard
                key={i}
                onRemove={() =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    matchOnPsArgs: dto.propensityScoreAdjustment.matchOnPsArgs.filter((_, k) => k !== i),
                  })
                }
              >
                <Field label={`matchOnPsArgs[${i}].description (string)`}>
                  <TextInput
                    value={m.description}
                    onChange={(e) => {
                      const arr = [...dto.propensityScoreAdjustment.matchOnPsArgs];
                      arr[i] = { ...arr[i], description: e.target.value };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, matchOnPsArgs: arr });
                    }}
                  />
                </Field>
                <Field label={`matchOnPsArgs[${i}].maxRatio (number)`}>
                  <NumInput
                    value={m.maxRatio}
                    onChange={(e) => {
                      const arr = [...dto.propensityScoreAdjustment.matchOnPsArgs];
                      arr[i] = { ...arr[i], maxRatio: Number(e.target.value || 0) };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, matchOnPsArgs: arr });
                    }}
                    min={0}
                  />
                </Field>
                <Field label={`matchOnPsArgs[${i}].caliper (number)`}>
                  <NumInput
                    step="0.01"
                    value={m.caliper}
                    onChange={(e) => {
                      const arr = [...dto.propensityScoreAdjustment.matchOnPsArgs];
                      arr[i] = { ...arr[i], caliper: Number(e.target.value) };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, matchOnPsArgs: arr });
                    }}
                    min={0}
                  />
                </Field>
                <Field label={`matchOnPsArgs[${i}].caliperScale (enum)`}>
                  <Select
                    value={m.caliperScale}
                    onChange={(v: CaliperScale) => {
                      const arr = [...dto.propensityScoreAdjustment.matchOnPsArgs];
                      arr[i] = { ...arr[i], caliperScale: v };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, matchOnPsArgs: arr });
                    }}
                    options={["propensity score", "standardized", "standardized logit"]}
                  />
                </Field>
              </RowCard>
            ))}
          </div>

          <ArrayHeader
            title="stratifyByPsArgs (array)"
            onAdd={() =>
              set("propensityScoreAdjustment", {
                ...dto.propensityScoreAdjustment,
                stratifyByPsArgs: [
                  ...dto.propensityScoreAdjustment.stratifyByPsArgs,
                  { description: "", numberOfStrata: 5, baseSelection: "all" },
                ],
              })
            }
          />
          <div className="space-y-3">
            {dto.propensityScoreAdjustment.stratifyByPsArgs.map((s, i) => (
              <RowCard
                key={i}
                onRemove={() =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    stratifyByPsArgs: dto.propensityScoreAdjustment.stratifyByPsArgs.filter((_, k) => k !== i),
                  })
                }
              >
                <Field label={`stratifyByPsArgs[${i}].description (string)`}>
                  <TextInput
                    value={s.description}
                    onChange={(e) => {
                      const arr = [...dto.propensityScoreAdjustment.stratifyByPsArgs];
                      arr[i] = { ...arr[i], description: e.target.value };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, stratifyByPsArgs: arr });
                    }}
                  />
                </Field>
                <Field label={`stratifyByPsArgs[${i}].numberOfStrata (number)`}>
                  <NumInput
                    value={s.numberOfStrata}
                    onChange={(e) => {
                      const arr = [...dto.propensityScoreAdjustment.stratifyByPsArgs];
                      arr[i] = { ...arr[i], numberOfStrata: Number(e.target.value || 0) };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, stratifyByPsArgs: arr });
                    }}
                    min={1}
                  />
                </Field>
                <Field label={`stratifyByPsArgs[${i}].baseSelection (enum)`}>
                  <Select
                    value={s.baseSelection}
                    onChange={(v: BaseSelection) => {
                      const arr = [...dto.propensityScoreAdjustment.stratifyByPsArgs];
                      arr[i] = { ...arr[i], baseSelection: v };
                      set("propensityScoreAdjustment", { ...dto.propensityScoreAdjustment, stratifyByPsArgs: arr });
                    }}
                    options={["all", "target", "comparator"]}
                  />
                </Field>
              </RowCard>
            ))}
          </div>

          <ArrayHeader title="createPsArgs" />
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="maxCohortSizeForFitting (number)">
              <NumInput
                value={dto.propensityScoreAdjustment.createPsArgs.maxCohortSizeForFitting}
                onChange={(e) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      maxCohortSizeForFitting: Number(e.target.value || 0),
                    },
                  })
                }
                min={0}
              />
            </Field>
            <Field label="errorOnHighCorrelation (boolean)">
              <Checkbox
                checked={dto.propensityScoreAdjustment.createPsArgs.errorOnHighCorrelation}
                onChange={(v) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: { ...dto.propensityScoreAdjustment.createPsArgs, errorOnHighCorrelation: v },
                  })
                }
              />
            </Field>

            <Field label="prior.priorType (enum: laplace)">
              <Select
                value={dto.propensityScoreAdjustment.createPsArgs.prior.priorType}
                onChange={() => { }}
                options={["laplace"]}
              />
            </Field>
            <Field label="prior.useCrossValidation (boolean)">
              <Checkbox
                checked={dto.propensityScoreAdjustment.createPsArgs.prior.useCrossValidation}
                onChange={(v) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      prior: { ...dto.propensityScoreAdjustment.createPsArgs.prior, useCrossValidation: v },
                    },
                  })
                }
              />
            </Field>

            <Field label="control.tolerance (number)">
              <NumInput
                step="0.0000001"
                value={dto.propensityScoreAdjustment.createPsArgs.control.tolerance}
                onChange={(e) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: {
                        ...dto.propensityScoreAdjustment.createPsArgs.control,
                        tolerance: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </Field>
            <Field label="control.cvType (enum)">
              <Select
                value={dto.propensityScoreAdjustment.createPsArgs.control.cvType}
                onChange={(v: CvType) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: { ...dto.propensityScoreAdjustment.createPsArgs.control, cvType: v },
                    },
                  })
                }
                options={["auto", "grid"]}
              />
            </Field>
            <Field label="control.fold (number)">
              <NumInput
                value={dto.propensityScoreAdjustment.createPsArgs.control.fold}
                onChange={(e) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: { ...dto.propensityScoreAdjustment.createPsArgs.control, fold: Number(e.target.value || 0) },
                    },
                  })
                }
                min={1}
              />
            </Field>
            <Field label="control.cvRepetitions (number)">
              <NumInput
                value={dto.propensityScoreAdjustment.createPsArgs.control.cvRepetitions}
                onChange={(e) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: {
                        ...dto.propensityScoreAdjustment.createPsArgs.control,
                        cvRepetitions: Number(e.target.value || 0),
                      },
                    },
                  })
                }
                min={1}
              />
            </Field>
            <Field label="control.noiseLevel (enum)">
              <Select
                value={dto.propensityScoreAdjustment.createPsArgs.control.noiseLevel}
                onChange={(v: NoiseLevel) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: { ...dto.propensityScoreAdjustment.createPsArgs.control, noiseLevel: v },
                    },
                  })
                }
                options={["silent", "quiet", "noisy"]}
              />
            </Field>
            <Field label="control.resetCoefficients (boolean)">
              <Checkbox
                checked={dto.propensityScoreAdjustment.createPsArgs.control.resetCoefficients}
                onChange={(v) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: { ...dto.propensityScoreAdjustment.createPsArgs.control, resetCoefficients: v },
                    },
                  })
                }
              />
            </Field>
            <Field label="control.startingVariance (number)">
              <NumInput
                step="0.0001"
                value={dto.propensityScoreAdjustment.createPsArgs.control.startingVariance}
                onChange={(e) =>
                  set("propensityScoreAdjustment", {
                    ...dto.propensityScoreAdjustment,
                    createPsArgs: {
                      ...dto.propensityScoreAdjustment.createPsArgs,
                      control: {
                        ...dto.propensityScoreAdjustment.createPsArgs.control,
                        startingVariance: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </Field>
          </div>
        </Section>

        {/* fitOutcomeModelArgs */}
        <Section title="fitOutcomeModelArgs">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="modelType (enum)">
              <Select
                value={dto.fitOutcomeModelArgs.modelType}
                onChange={(v: ModelType) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, modelType: v })}
                options={["logistic", "poisson", "cox"]}
              />
            </Field>
            <Field label="stratified (boolean)">
              <Checkbox
                checked={dto.fitOutcomeModelArgs.stratified}
                onChange={(v) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, stratified: v })}
              />
            </Field>
            <Field label="useCovariates (boolean)">
              <Checkbox
                checked={dto.fitOutcomeModelArgs.useCovariates}
                onChange={(v) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, useCovariates: v })}
              />
            </Field>
            <Field label="inversePtWeighting (boolean)">
              <Checkbox
                checked={dto.fitOutcomeModelArgs.inversePtWeighting}
                onChange={(v) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, inversePtWeighting: v })}
              />
            </Field>

            <Field label="prior.priorType (enum: laplace)">
              <Select
                value={dto.fitOutcomeModelArgs.prior.priorType}
                onChange={() => { }}
                options={["laplace"]}
              />
            </Field>
            <Field label="prior.useCrossValidation (boolean)">
              <Checkbox
                checked={dto.fitOutcomeModelArgs.prior.useCrossValidation}
                onChange={(v) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    prior: { ...dto.fitOutcomeModelArgs.prior, useCrossValidation: v },
                  })
                }
              />
            </Field>

            <Field label="control.tolerance (number)">
              <NumInput
                step="0.0000001"
                value={dto.fitOutcomeModelArgs.control.tolerance}
                onChange={(e) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, tolerance: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="control.cvType (enum)">
              <Select
                value={dto.fitOutcomeModelArgs.control.cvType}
                onChange={(v: CvType) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, cvType: v },
                  })
                }
                options={["auto", "grid"]}
              />
            </Field>
            <Field label="control.fold (number)">
              <NumInput
                value={dto.fitOutcomeModelArgs.control.fold}
                onChange={(e) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, fold: Number(e.target.value || 0) },
                  })
                }
                min={1}
              />
            </Field>
            <Field label="control.cvRepetitions (number)">
              <NumInput
                value={dto.fitOutcomeModelArgs.control.cvRepetitions}
                onChange={(e) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, cvRepetitions: Number(e.target.value || 0) },
                  })
                }
                min={1}
              />
            </Field>
            <Field label="control.noiseLevel (enum)">
              <Select
                value={dto.fitOutcomeModelArgs.control.noiseLevel}
                onChange={(v: NoiseLevel) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, noiseLevel: v },
                  })
                }
                options={["silent", "quiet", "noisy"]}
              />
            </Field>
            <Field label="control.resetCoefficients (boolean)">
              <Checkbox
                checked={dto.fitOutcomeModelArgs.control.resetCoefficients}
                onChange={(v) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, resetCoefficients: v },
                  })
                }
              />
            </Field>
            <Field label="control.startingVariance (number)">
              <NumInput
                step="0.0001"
                value={dto.fitOutcomeModelArgs.control.startingVariance}
                onChange={(e) =>
                  set("fitOutcomeModelArgs", {
                    ...dto.fitOutcomeModelArgs,
                    control: { ...dto.fitOutcomeModelArgs.control, startingVariance: Number(e.target.value) },
                  })
                }
              />
            </Field>
          </div>
        </Section>

        <Section title="Preview & Export">
          <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-64">
            {jsonPretty}
          </pre>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50" onClick={copy}>
              Copy JSON
            </button>
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => setOpen(true)}>
              확인 (Popup)
            </button>
          </div>
        </Section>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">선택/입력한 값으로 아래 JSON이 생성되었습니다. 이 구성을 진행할까요?</p>
          <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-[50vh]">
            {jsonPretty}
          </pre>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded-xl border" onClick={() => setOpen(false)}>
              취소
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-blue-600 text-white"
              onClick={() => {
                setOpen(false);
                alert("확인되었습니다. (여기서 API 호출 로직을 연결하세요)");
              }}
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
