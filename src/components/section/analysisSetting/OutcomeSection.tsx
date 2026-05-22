import { ArrayHeader, Field, NumInput, RowCard, SectionCard, Select, TextInput, YesNoToggle } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { CvType, ModelType, NoiseLevel, OutcomeModel } from "@/types/dtoBuilderType";
import { observer } from "mobx-react-lite";

function OutcomeSection() {
    const { study } = useStore()
    const { dto, set } = study

    const fitArgs = dto.fitOutcomeModelArgs;

    const addOutcomeModel = () => {
        set("fitOutcomeModelArgs", {
            ...fitArgs,
            outcomeModels: [
                ...fitArgs.outcomeModels,
                {
                    description: `Model ${fitArgs.outcomeModels.length + 1}`,
                    modelType: "cox" as ModelType,
                    useCovariates: false,
                } satisfies OutcomeModel,
            ],
        });
    };

    const removeOutcomeModel = (idx: number) => {
        set("fitOutcomeModelArgs", {
            ...fitArgs,
            outcomeModels: fitArgs.outcomeModels.filter((_, i) => i !== idx),
        });
    };

    const setOutcomeModel = (idx: number, next: Partial<OutcomeModel>) => {
        const arr = [...fitArgs.outcomeModels];
        arr[idx] = { ...arr[idx], ...next };
        set("fitOutcomeModelArgs", { ...fitArgs, outcomeModels: arr });
    };

    return (
        <SectionCard title="Outcome Model">
            <div className="flex flex-col gap-3">

                {/* outcomeModels array (C5) */}
                <ArrayHeader title="Outcome Models" onAdd={addOutcomeModel} />
                <div className="space-y-3">
                    {fitArgs.outcomeModels.map((m, i) => (
                        <RowCard key={i} onRemove={() => removeOutcomeModel(i)} oneColumn>
                            <Field label="Description">
                                <TextInput
                                    value={m.description}
                                    onChange={(e) => setOutcomeModel(i, { description: e.target.value })}
                                    placeholder="Type Description"
                                />
                            </Field>
                            <Field title="Model Type" label="Specify the statistical model used to estimate the risk of outcome between target and comparator cohorts">
                                <Select
                                    value={m.modelType}
                                    onChange={(v: ModelType) => setOutcomeModel(i, { modelType: v })}
                                    options={["logistic", "poisson", "cox"]}
                                />
                            </Field>
                            <Field
                                title="Include covariates in outcome model"
                                label="Should the covariates also be included in the outcome model?"
                            >
                                <YesNoToggle
                                    checked={m.useCovariates}
                                    onChange={(v) => setOutcomeModel(i, { useCovariates: v })}
                                />
                            </Field>
                        </RowCard>
                    ))}
                </div>

                {/* top-level stratified (C5) */}
                <Field
                    title="Condition regression on strata"
                    label="Should the regression be conditioned on the strata defined in the population object (e.g. by matching or stratifying on propensity scores)?"
                >
                    <YesNoToggle
                        checked={fitArgs.stratified}
                        onChange={(v) => set("fitOutcomeModelArgs", { ...fitArgs, stratified: v })}
                    />
                </Field>

                {/* ── Use regularization (derive from DTO: both prior & control exist) */}
                {(() => {
                    const isRegOn =
                        Boolean(fitArgs.prior && fitArgs.control);

                    const defaultPrior = (): NonNullable<typeof fitArgs.prior> => ({
                        priorType: "laplace",
                        useCrossValidation: false,
                    });

                    const defaultControl = (): NonNullable<typeof fitArgs.control> => ({
                        tolerance: 1e-7,
                        cvType: "auto",
                        fold: 5,
                        cvRepetitions: 1,
                        noiseLevel: "quiet",
                        resetCoefficients: false,
                        startingVariance: -1,
                    });

                    const toggleRegularization = (v: boolean) => {
                        if (!v) {
                            // OFF → null
                            set("fitOutcomeModelArgs", {
                                ...fitArgs,
                                prior: null,
                                control: null,
                            });
                        } else {
                            // ON → fill defaults if empty
                            set("fitOutcomeModelArgs", {
                                ...fitArgs,
                                prior: fitArgs.prior ?? defaultPrior(),
                                control: fitArgs.control ?? defaultControl(),
                            });
                        }
                    };

                    return (
                        <>
                            <Field
                                title="Use regularization"
                                label="Use regularization when fitting the outcome model?"
                            >
                                <YesNoToggle checked={isRegOn} onChange={toggleRegularization} />
                            </Field>

                            {/* PRIOR / CONTROL: Show only when regularization is ON */}
                            {isRegOn && fitArgs.prior && fitArgs.control && (
                                <>
                                    <SectionCard title="Control Settings">
                                        <Field label="Maximum relative change in convergence criterion from successive iterations">
                                            <NumInput
                                                step="0.0000001"
                                                value={fitArgs.control.tolerance}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: {
                                                            ...fitArgs.control!,
                                                            tolerance: Number(e.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="Select the cross validation search type">
                                            <Select
                                                value={fitArgs.control.cvType}
                                                onChange={(v: CvType) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: { ...fitArgs.control!, cvType: v },
                                                    })
                                                }
                                                options={["auto"]}
                                            />
                                        </Field>

                                        <Field label="Number of random folds to employ in cross validation">
                                            <NumInput
                                                value={fitArgs.control.fold}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: {
                                                            ...fitArgs.control!,
                                                            fold: Number(e.target.value || 0),
                                                        },
                                                    })
                                                }
                                                min={1}
                                            />
                                        </Field>

                                        <Field label="Number of repetitions of 10-fold cross validation">
                                            <NumInput
                                                value={fitArgs.control.cvRepetitions}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: {
                                                            ...fitArgs.control!,
                                                            cvRepetitions: Number(e.target.value || 0),
                                                        },
                                                    })
                                                }
                                                min={1}
                                            />
                                        </Field>

                                        <Field label="Noise level for Cyclops screen output">
                                            <Select
                                                value={fitArgs.control.noiseLevel}
                                                onChange={(v: NoiseLevel) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: { ...fitArgs.control!, noiseLevel: v },
                                                    })
                                                }
                                                options={["silent", "quiet", "noisy"]}
                                            />
                                        </Field>

                                        <Field label="Reset all coefficients to 0 between model fits under cross-validation">
                                            <YesNoToggle
                                                checked={fitArgs.control.resetCoefficients}
                                                onChange={(v) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: {
                                                            ...fitArgs.control!,
                                                            resetCoefficients: v,
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="Starting variance for auto-search cross-validation (-1 mean use estimate based on data)">
                                            <NumInput
                                                step="0.0001"
                                                value={fitArgs.control.startingVariance}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        control: {
                                                            ...fitArgs.control!,
                                                            startingVariance: Number(e.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>
                                    </SectionCard>
                                    <SectionCard title="Prior">
                                        <Field label="Specify the prior distribution">
                                            <Select
                                                value={fitArgs.prior.priorType}
                                                onChange={() => { }}
                                                options={["laplace"]}
                                            />
                                        </Field>

                                        <Field label="Perform cross-validation to determine prior-variance">
                                            <YesNoToggle
                                                checked={fitArgs.prior.useCrossValidation}
                                                onChange={(v) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...fitArgs,
                                                        prior: {
                                                            ...fitArgs.prior!,
                                                            useCrossValidation: v,
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>
                                    </SectionCard>


                                </>
                            )}
                        </>
                    );
                })()}

            </div>
        </SectionCard>

    )
}

export default observer(OutcomeSection)
