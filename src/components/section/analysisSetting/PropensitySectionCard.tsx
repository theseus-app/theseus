import { ArrayHeader, Field, NumInput, RowCard, SectionCard, Select, TextInput, YesNoToggle } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { StudyDTO, CaliperScale, BaseSelection, CvType, NoiseLevel, PsSetting } from "@/types/dtoBuilderType";
import { observer } from "mobx-react-lite";
import { useMemo, useState, useEffect } from "react";

function PropensitySectionCard() {

    const { study } = useStore()
    const { dto, set } = study

    const psa = dto.propensityScoreAdjustment;

    // only managed by UI (no info in DTO)
    const isRegOnFromDto = useMemo(
        () => Boolean(psa.createPsArgs.prior && psa.createPsArgs.control),
        [psa.createPsArgs.prior, psa.createPsArgs.control]
    );
    const [useRegularization, setUseRegularization] = useState<boolean>(isRegOnFromDto);

    useEffect(() => {
        setUseRegularization(isRegOnFromDto);
    }, [isRegOnFromDto]);

    const defaultPrior = (): NonNullable<StudyDTO["propensityScoreAdjustment"]["createPsArgs"]["prior"]> => ({
        priorType: "laplace",
        useCrossValidation: false,
    });

    const defaultControl = (): NonNullable<StudyDTO["propensityScoreAdjustment"]["createPsArgs"]["control"]> => ({
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
            set("propensityScoreAdjustment", {
                ...psa,
                createPsArgs: { ...psa.createPsArgs, prior: null, control: null },
            });
        } else {
            set("propensityScoreAdjustment", {
                ...psa,
                createPsArgs: {
                    ...psa.createPsArgs,
                    prior: psa.createPsArgs.prior ?? defaultPrior(),
                    control: psa.createPsArgs.control ?? defaultControl(),
                },
            });
        }
    };

    const addSetting = () => {
        set("propensityScoreAdjustment", {
            ...psa,
            psSettings: [
                ...psa.psSettings,
                {
                    description: "",
                    matchOnPsArgs: { maxRatio: 1, caliper: 0, caliperScale: "propensity score" as CaliperScale },
                    stratifyByPsArgs: null,
                } satisfies PsSetting,
            ],
        });
    };

    const removeSetting = (idx: number) => {
        set("propensityScoreAdjustment", {
            ...psa,
            psSettings: psa.psSettings.filter((_, i) => i !== idx),
        });
    };

    const setPsSetting = (idx: number, next: Partial<PsSetting>) => {
        const arr = [...psa.psSettings];
        arr[idx] = { ...arr[idx], ...next };
        set("propensityScoreAdjustment", { ...psa, psSettings: arr });
    };

    const setMode = (idx: number, mode: "match" | "stratify") => {
        const arr = [...psa.psSettings];
        const cur = { ...arr[idx] };
        if (mode === "match") {
            cur.matchOnPsArgs = cur.matchOnPsArgs ?? { maxRatio: 1, caliper: 0, caliperScale: "propensity score" };
            cur.stratifyByPsArgs = null;
        } else {
            cur.stratifyByPsArgs = cur.stratifyByPsArgs ?? { numberOfStrata: 5, baseSelection: "all" };
            cur.matchOnPsArgs = null;
        }
        arr[idx] = cur;
        set("propensityScoreAdjustment", { ...psa, psSettings: arr });
    };

    return (
        <SectionCard title="Propensity Score Adjustment">
            {/* psSettings */}
            <ArrayHeader title="Propensity Score Setting" onAdd={addSetting} />
            <div className="space-y-3">
                {psa.psSettings.map((s, i) => {
                    const mode: "match" | "stratify" = s.matchOnPsArgs ? "match" : "stratify";
                    return (
                        <RowCard key={i} onRemove={() => removeSetting(i)} oneColumn>
                            <Field label={`Description`}>
                                <TextInput
                                    value={s.description}
                                    onChange={(e) => setPsSetting(i, { description: e.target.value })}
                                    placeholder="Type Description"
                                />
                            </Field>

                            <Field title={`Mode`}>
                                <Select value={mode} onChange={(v: "match" | "stratify") => setMode(i, v)} options={["match", "stratify"]} />
                            </Field>

                            {/* match */}
                            {mode === "match" && s.matchOnPsArgs && (
                                <>
                                    <Field title="Matching Ratio (Maximum Comparators per Target)" label={`comparators per target person, 0 means no maximum`}>
                                        <NumInput
                                            value={s.matchOnPsArgs.maxRatio}
                                            onChange={(e) => {
                                                const arr = [...psa.psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    matchOnPsArgs: { ...arr[i].matchOnPsArgs!, maxRatio: Number(e.target.value || 0) },
                                                };
                                                set("propensityScoreAdjustment", { ...psa, psSettings: arr });
                                            }}
                                            min={0}
                                        />
                                    </Field>

                                    <Field title="Caliper" label='Maximum allowed difference in matching variable (e.g., propensity score) between target and comparator'>
                                        <NumInput
                                            step="0.01"
                                            value={s.matchOnPsArgs.caliper}
                                            onChange={(e) => {
                                                const arr = [...psa.psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    matchOnPsArgs: { ...arr[i].matchOnPsArgs!, caliper: Number(e.target.value || 0) },
                                                };
                                                set("propensityScoreAdjustment", { ...psa, psSettings: arr });
                                            }}
                                            min={0}
                                        />
                                    </Field>

                                    <Field title='Caliper Scale' label='Unit of the Caliper Value'>
                                        <Select
                                            value={s.matchOnPsArgs.caliperScale}
                                            onChange={(v: CaliperScale) => {
                                                const arr = [...psa.psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    matchOnPsArgs: { ...arr[i].matchOnPsArgs!, caliperScale: v },
                                                };
                                                set("propensityScoreAdjustment", { ...psa, psSettings: arr });
                                            }}
                                            options={["propensity score", "standardized", "standardized logit"]}
                                        />
                                    </Field>
                                </>
                            )}

                            {/* stratify */}
                            {mode === "stratify" && s.stratifyByPsArgs && (
                                <>
                                    <Field
                                        title="Number of strata for propensity score stratification"
                                        label="Into how many strata should the propensity score be divided?"
                                    >                                        <NumInput
                                            value={s.stratifyByPsArgs.numberOfStrata}
                                            onChange={(e) => {
                                                const arr = [...psa.psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    stratifyByPsArgs: {
                                                        ...arr[i].stratifyByPsArgs!,
                                                        numberOfStrata: Number(e.target.value || 0),
                                                    },
                                                };
                                                set("propensityScoreAdjustment", { ...psa, psSettings: arr });
                                            }}
                                            min={1}
                                        />
                                    </Field>

                                    <Field
                                        title="Base selection for strata bounds"
                                        label="What is the base selection of subjects where the strata bounds are to be determined?"
                                    >                                        <Select
                                            value={s.stratifyByPsArgs.baseSelection}
                                            onChange={(v: BaseSelection) => {
                                                const arr = [...psa.psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    stratifyByPsArgs: { ...arr[i].stratifyByPsArgs!, baseSelection: v },
                                                };
                                                set("propensityScoreAdjustment", { ...psa, psSettings: arr });
                                            }}
                                            options={["all", "target", "comparator"]}
                                        />
                                    </Field>
                                </>
                            )}
                        </RowCard>
                    );
                })}
            </div>

            {/* createPsArgs */}
            <div className="flex flex-col gap-3">
                <Field
                    title="Maximum cohort size for fitting"
                    label="What is the maximum number of people to include in the propensity score model when fitting? Setting this number to 0 means no down-sampling will be applied:"
                >                    <NumInput
                        value={psa.createPsArgs.maxCohortSizeForFitting}
                        onChange={(e) =>
                            set("propensityScoreAdjustment", {
                                ...psa,
                                createPsArgs: {
                                    ...psa.createPsArgs,
                                    maxCohortSizeForFitting: Number(e.target.value || 0),
                                },
                            })
                        }
                        min={0}
                    />
                </Field>

                <Field
                    title="Error on high correlation"
                    label="Test each covariate for correlation with the target assignment? If any covariate has an unusually high correlation (either positive or negative), this will throw an error."
                >
                    <YesNoToggle
                        checked={psa.createPsArgs.errorOnHighCorrelation}
                        onChange={(v) =>
                            set("propensityScoreAdjustment", {
                                ...psa,
                                createPsArgs: { ...psa.createPsArgs, errorOnHighCorrelation: v },
                            })
                        }
                    />
                </Field>

                {/* Use regularization (UI state) */}
                <Field
                    title="Use regularization"
                    label="Use regularization when fitting the propensity model?"
                >
                    <YesNoToggle checked={useRegularization} onChange={toggleRegularization} />
                </Field>

                {/* PRIOR / CONTROL: 정규화 ON일 때만 노출 (둘 다 존재) */}
                {useRegularization && psa.createPsArgs.prior && psa.createPsArgs.control && (
                    <>
                        <SectionCard title="Control Settings">
                            <Field label="Maximum relative change in convergence criterion from successive iterations">
                                <NumInput
                                    step="0.0000001"
                                    value={psa.createPsArgs.control.tolerance}
                                    onChange={(e) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: {
                                                ...psa.createPsArgs,
                                                control: { ...psa.createPsArgs.control!, tolerance: Number(e.target.value) },
                                            },
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Select the cross validation search type">
                                <Select
                                    value={psa.createPsArgs.control.cvType}
                                    onChange={(v: CvType) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: { ...psa.createPsArgs, control: { ...psa.createPsArgs.control!, cvType: v } },
                                        })
                                    }
                                    options={["auto"]}
                                />
                            </Field>

                            <Field label="Number of random folds to employ in cross validation">
                                <NumInput
                                    value={psa.createPsArgs.control.fold}
                                    onChange={(e) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: {
                                                ...psa.createPsArgs,
                                                control: { ...psa.createPsArgs.control!, fold: Number(e.target.value || 0) },
                                            },
                                        })
                                    }
                                    min={1}
                                />
                            </Field>

                            <Field label="Number of repetitions of 10-fold cross validation">
                                <NumInput
                                    value={psa.createPsArgs.control.cvRepetitions}
                                    onChange={(e) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: {
                                                ...psa.createPsArgs,
                                                control: { ...psa.createPsArgs.control!, cvRepetitions: Number(e.target.value || 0) },
                                            },
                                        })
                                    }
                                    min={1}
                                />
                            </Field>

                            <Field label="Noise level for Cyclops screen output">
                                <Select
                                    value={psa.createPsArgs.control.noiseLevel}
                                    onChange={(v: NoiseLevel) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: { ...psa.createPsArgs, control: { ...psa.createPsArgs.control!, noiseLevel: v } },
                                        })
                                    }
                                    options={["silent", "quiet", "noisy"]}
                                />
                            </Field>

                            <Field label="Reset all coefficients to 0 between model fits under cross-validation">
                                <YesNoToggle
                                    checked={psa.createPsArgs.control.resetCoefficients}
                                    onChange={(v) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: { ...psa.createPsArgs, control: { ...psa.createPsArgs.control!, resetCoefficients: v } },
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Starting variance for auto-search cross-validation (-1 mean use estimate based on data)">
                                <NumInput
                                    step="0.0001"
                                    value={psa.createPsArgs.control.startingVariance}
                                    onChange={(e) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: {
                                                ...psa.createPsArgs,
                                                control: { ...psa.createPsArgs.control!, startingVariance: Number(e.target.value) },
                                            },
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>
                        <SectionCard title="Prior">
                            <Field label="Specify the prior distribution">
                                <Select value={psa.createPsArgs.prior.priorType} onChange={() => { }} options={["laplace"]} />
                            </Field>

                            <Field label="Perform cross-validation to determine prior-variance">
                                <YesNoToggle
                                    checked={psa.createPsArgs.prior.useCrossValidation}
                                    onChange={(v) =>
                                        set("propensityScoreAdjustment", {
                                            ...psa,
                                            createPsArgs: {
                                                ...psa.createPsArgs,
                                                prior: { ...psa.createPsArgs.prior!, useCrossValidation: v },
                                            },
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>
                    </>
                )}
            </div>
        </SectionCard>
    );
}

export default observer(PropensitySectionCard)