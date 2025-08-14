import { Field, NumInput, SectionCard, Select, YesNoToggle } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { CvType, ModelType, NoiseLevel } from "@/type/dtoBuilderType";
import { observer } from "mobx-react-lite";

function OutcomeSection() {
    const { study } = useStore()
    const { dto, set } = study
    return (
        <SectionCard title="Outcome Model">
            <div className="flex flex-col gap-3">

                <Field title="Model Type" label="Specify the statistical model used to estimate the risk of outcome between target and comparator cohorts">
                    <Select
                        value={dto.fitOutcomeModelArgs.modelType}
                        onChange={(v: ModelType) =>
                            set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, modelType: v })
                        }
                        options={["logistic", "poisson", "cox"]}
                    />
                </Field>

                <Field
                    title="Condition regression on strata"
                    label="Should the regression be conditioned on the strata defined in the population object (e.g. by matching or stratifying on propensity scores)?"
                >
                    <YesNoToggle
                        checked={dto.fitOutcomeModelArgs.stratified}
                        onChange={(v) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, stratified: v })}
                    />
                </Field>

                <Field
                    title="Include covariates in outcome model"
                    label="Should the covariates also be included in the outcome model?"
                >
                    <YesNoToggle
                        checked={dto.fitOutcomeModelArgs.useCovariates}
                        onChange={(v) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, useCovariates: v })}
                    />
                </Field>

                <Field title="Use inverse probability of treatment weighting?">
                    <YesNoToggle
                        checked={dto.fitOutcomeModelArgs.inversePtWeighting}
                        onChange={(v) => set("fitOutcomeModelArgs", { ...dto.fitOutcomeModelArgs, inversePtWeighting: v })}
                    />
                </Field>

                {/* ── Use regularization (derive from DTO: both prior & control exist) */}
                {(() => {
                    const isRegOn =
                        Boolean(dto.fitOutcomeModelArgs.prior && dto.fitOutcomeModelArgs.control);

                    const defaultPrior = (): NonNullable<typeof dto.fitOutcomeModelArgs.prior> => ({
                        priorType: "laplace",
                        useCrossValidation: false,
                    });

                    const defaultControl = (): NonNullable<typeof dto.fitOutcomeModelArgs.control> => ({
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
                            // OFF → null 저장
                            set("fitOutcomeModelArgs", {
                                ...dto.fitOutcomeModelArgs,
                                prior: null,
                                control: null,
                            });
                        } else {
                            // ON → 비어있으면 기본값 채움
                            set("fitOutcomeModelArgs", {
                                ...dto.fitOutcomeModelArgs,
                                prior: dto.fitOutcomeModelArgs.prior ?? defaultPrior(),
                                control: dto.fitOutcomeModelArgs.control ?? defaultControl(),
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

                            {/* PRIOR / CONTROL: 정규화 ON일 때만 노출 */}
                            {isRegOn && dto.fitOutcomeModelArgs.prior && dto.fitOutcomeModelArgs.control && (
                                <>
                                    <SectionCard title="Control Settings">
                                        <Field label="Maximum relative change in convergence criterion from successive iterations">
                                            <NumInput
                                                step="0.0000001"
                                                value={dto.fitOutcomeModelArgs.control.tolerance}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: {
                                                            ...dto.fitOutcomeModelArgs.control!,
                                                            tolerance: Number(e.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="Select the cross validation search type">
                                            <Select
                                                value={dto.fitOutcomeModelArgs.control.cvType}
                                                onChange={(v: CvType) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: { ...dto.fitOutcomeModelArgs.control!, cvType: v },
                                                    })
                                                }
                                                options={["auto", "grid"]}
                                            />
                                        </Field>

                                        <Field label="Number of random folds to employ in cross validation">
                                            <NumInput
                                                value={dto.fitOutcomeModelArgs.control.fold}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: {
                                                            ...dto.fitOutcomeModelArgs.control!,
                                                            fold: Number(e.target.value || 0),
                                                        },
                                                    })
                                                }
                                                min={1}
                                            />
                                        </Field>

                                        <Field label="Number of repetitions of 10-fold cross validation">
                                            <NumInput
                                                value={dto.fitOutcomeModelArgs.control.cvRepetitions}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: {
                                                            ...dto.fitOutcomeModelArgs.control!,
                                                            cvRepetitions: Number(e.target.value || 0),
                                                        },
                                                    })
                                                }
                                                min={1}
                                            />
                                        </Field>

                                        <Field label="Noise level for Cyclops screen output">
                                            <Select
                                                value={dto.fitOutcomeModelArgs.control.noiseLevel}
                                                onChange={(v: NoiseLevel) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: { ...dto.fitOutcomeModelArgs.control!, noiseLevel: v },
                                                    })
                                                }
                                                options={["silent", "quiet", "noisy"]}
                                            />
                                        </Field>

                                        <Field label="Reset all coefficients to 0 between model fits under cross-validation">
                                            <YesNoToggle
                                                checked={dto.fitOutcomeModelArgs.control.resetCoefficients}
                                                onChange={(v) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: {
                                                            ...dto.fitOutcomeModelArgs.control!,
                                                            resetCoefficients: v,
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="Starting variance for auto-search cross-validation (-1 mean use estimate based on data)">
                                            <NumInput
                                                step="0.0001"
                                                value={dto.fitOutcomeModelArgs.control.startingVariance}
                                                onChange={(e) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        control: {
                                                            ...dto.fitOutcomeModelArgs.control!,
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
                                                value={dto.fitOutcomeModelArgs.prior.priorType}
                                                onChange={() => { }}
                                                options={["laplace"]}
                                            />
                                        </Field>

                                        <Field label="Perform cross-validation to determine prior-variance">
                                            <YesNoToggle
                                                checked={dto.fitOutcomeModelArgs.prior.useCrossValidation}
                                                onChange={(v) =>
                                                    set("fitOutcomeModelArgs", {
                                                        ...dto.fitOutcomeModelArgs,
                                                        prior: {
                                                            ...dto.fitOutcomeModelArgs.prior!,
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