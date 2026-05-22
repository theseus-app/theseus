import { ArrayHeader, Field, NumInput, RowCard, SectionCard, Select, TextInput, YesNoToggle } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { StudyDTO, CaliperScale, BaseSelection, CvType, NoiseLevel, PsSetting, TrimByPsArgs } from "@/types/dtoBuilderType";
import { observer } from "mobx-react-lite";
import { useMemo, useState, useEffect } from "react";

function PropensitySectionCard() {

    const { study } = useStore()
    const { dto, set } = study

    const psSettings = dto.psSettings;
    const createPsArgs = dto.createPsArgs;

    // only managed by UI (no info in DTO)
    const isRegOnFromDto = useMemo(
        () => Boolean(createPsArgs.prior && createPsArgs.control),
        [createPsArgs.prior, createPsArgs.control]
    );
    const [useRegularization, setUseRegularization] = useState<boolean>(isRegOnFromDto);

    useEffect(() => {
        setUseRegularization(isRegOnFromDto);
    }, [isRegOnFromDto]);

    const defaultPrior = (): NonNullable<StudyDTO["createPsArgs"]["prior"]> => ({
        priorType: "laplace",
        useCrossValidation: false,
    });

    const defaultControl = (): NonNullable<StudyDTO["createPsArgs"]["control"]> => ({
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
            set("createPsArgs", {
                ...createPsArgs,
                prior: null,
                control: null,
            });
        } else {
            set("createPsArgs", {
                ...createPsArgs,
                prior: createPsArgs.prior ?? defaultPrior(),
                control: createPsArgs.control ?? defaultControl(),
            });
        }
    };

    const addSetting = () => {
        set("psSettings", [
            ...psSettings,
            {
                description: `PS ${psSettings.length + 1}`,
                trimByPsArgs: null,
                matchOnPsArgs: { maxRatio: 1, caliper: 0.2, caliperScale: "standardized logit" as CaliperScale },
                stratifyByPsArgs: null,
                inversePtWeighting: false,
            } satisfies PsSetting,
        ]);
    };

    const removeSetting = (idx: number) => {
        set("psSettings", psSettings.filter((_, i) => i !== idx));
    };

    const setPsSetting = (idx: number, next: Partial<PsSetting>) => {
        const arr = [...psSettings];
        arr[idx] = { ...arr[idx], ...next };
        set("psSettings", arr);
    };

    const setMode = (idx: number, mode: "match" | "stratify") => {
        const arr = [...psSettings];
        const cur = { ...arr[idx] };
        if (mode === "match") {
            cur.matchOnPsArgs = cur.matchOnPsArgs ?? { maxRatio: 1, caliper: 0, caliperScale: "propensity score" };
            cur.stratifyByPsArgs = null;
        } else {
            cur.stratifyByPsArgs = cur.stratifyByPsArgs ?? { numberOfStrata: 5, baseSelection: "all" };
            cur.matchOnPsArgs = null;
        }
        arr[idx] = cur;
        set("psSettings", arr);
    };

    // trimByPsArgs mode helpers
    const getTrimMode = (trimByPsArgs: TrimByPsArgs | null): "off" | "percent" | "equipoise" => {
        if (trimByPsArgs === null) return "off";
        if (trimByPsArgs.trimFraction !== null) return "percent";
        return "equipoise";
    };

    const setTrimMode = (idx: number, mode: "off" | "percent" | "equipoise") => {
        let trimByPsArgs: TrimByPsArgs | null;
        if (mode === "off") {
            trimByPsArgs = null;
        } else if (mode === "percent") {
            trimByPsArgs = { trimFraction: 0.05, equipoiseBounds: null };
        } else {
            trimByPsArgs = { trimFraction: null, equipoiseBounds: [0.3, 0.7] };
        }
        setPsSetting(idx, { trimByPsArgs });
    };

    return (
        <SectionCard title="Propensity Score Adjustment">
            {/* psSettings */}
            <ArrayHeader title="Propensity Score Setting" onAdd={addSetting} />
            <div className="space-y-3">
                {psSettings.map((s, i) => {
                    const mode: "match" | "stratify" = s.matchOnPsArgs ? "match" : "stratify";
                    const trimMode = getTrimMode(s.trimByPsArgs);
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
                                                const arr = [...psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    matchOnPsArgs: { ...arr[i].matchOnPsArgs!, maxRatio: Number(e.target.value || 0) },
                                                };
                                                set("psSettings", arr);
                                            }}
                                            min={0}
                                        />
                                    </Field>

                                    <Field title="Caliper" label='Maximum allowed difference in matching variable (e.g., propensity score) between target and comparator'>
                                        <NumInput
                                            step="0.01"
                                            value={s.matchOnPsArgs.caliper}
                                            onChange={(e) => {
                                                const arr = [...psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    matchOnPsArgs: { ...arr[i].matchOnPsArgs!, caliper: Number(e.target.value || 0) },
                                                };
                                                set("psSettings", arr);
                                            }}
                                            min={0}
                                        />
                                    </Field>

                                    <Field title='Caliper Scale' label='Unit of the Caliper Value'>
                                        <Select
                                            value={s.matchOnPsArgs.caliperScale}
                                            onChange={(v: CaliperScale) => {
                                                const arr = [...psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    matchOnPsArgs: { ...arr[i].matchOnPsArgs!, caliperScale: v },
                                                };
                                                set("psSettings", arr);
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
                                                const arr = [...psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    stratifyByPsArgs: {
                                                        ...arr[i].stratifyByPsArgs!,
                                                        numberOfStrata: Number(e.target.value || 0),
                                                    },
                                                };
                                                set("psSettings", arr);
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
                                                const arr = [...psSettings];
                                                arr[i] = {
                                                    ...arr[i],
                                                    stratifyByPsArgs: { ...arr[i].stratifyByPsArgs!, baseSelection: v },
                                                };
                                                set("psSettings", arr);
                                            }}
                                            options={["all", "target", "comparator"]}
                                        />
                                    </Field>
                                </>
                            )}

                            {/* trimByPsArgs (C4) */}
                            <Field title="PS Trimming" label="Trim subjects based on propensity score?">
                                <Select
                                    value={trimMode}
                                    onChange={(v: "off" | "percent" | "equipoise") => setTrimMode(i, v)}
                                    options={["off", "percent", "equipoise"]}
                                />
                            </Field>

                            {trimMode === "percent" && s.trimByPsArgs && s.trimByPsArgs.trimFraction !== null && (
                                <Field title="Trim Fraction" label="Fraction of subjects to trim from each side based on propensity score">
                                    <NumInput
                                        step="0.01"
                                        value={s.trimByPsArgs.trimFraction}
                                        onChange={(e) => {
                                            const arr = [...psSettings];
                                            arr[i] = {
                                                ...arr[i],
                                                trimByPsArgs: { trimFraction: Number(e.target.value || 0), equipoiseBounds: null },
                                            };
                                            set("psSettings", arr);
                                        }}
                                        min={0}
                                    />
                                </Field>
                            )}

                            {trimMode === "equipoise" && s.trimByPsArgs && s.trimByPsArgs.equipoiseBounds !== null && (
                                <>
                                    <Field title="Equipoise Lower Bound" label="Lower bound for the equipoise range">
                                        <NumInput
                                            step="0.01"
                                            value={s.trimByPsArgs.equipoiseBounds[0]}
                                            onChange={(e) => {
                                                const arr = [...psSettings];
                                                const bounds = arr[i].trimByPsArgs!.equipoiseBounds!;
                                                arr[i] = {
                                                    ...arr[i],
                                                    trimByPsArgs: { trimFraction: null, equipoiseBounds: [Number(e.target.value || 0), bounds[1]] },
                                                };
                                                set("psSettings", arr);
                                            }}
                                            min={0}
                                        />
                                    </Field>
                                    <Field title="Equipoise Upper Bound" label="Upper bound for the equipoise range">
                                        <NumInput
                                            step="0.01"
                                            value={s.trimByPsArgs.equipoiseBounds[1]}
                                            onChange={(e) => {
                                                const arr = [...psSettings];
                                                const bounds = arr[i].trimByPsArgs!.equipoiseBounds!;
                                                arr[i] = {
                                                    ...arr[i],
                                                    trimByPsArgs: { trimFraction: null, equipoiseBounds: [bounds[0], Number(e.target.value || 0)] },
                                                };
                                                set("psSettings", arr);
                                            }}
                                            min={0}
                                        />
                                    </Field>
                                </>
                            )}

                            {/* inversePtWeighting (C4) */}
                            <Field title="Use Inverse Probability of Treatment Weighting (IPTW)" label="Apply IPTW adjustment for this propensity score setting?">
                                <YesNoToggle
                                    checked={s.inversePtWeighting}
                                    onChange={(v) => setPsSetting(i, { inversePtWeighting: v })}
                                />
                            </Field>
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
                        value={createPsArgs.maxCohortSizeForFitting}
                        onChange={(e) =>
                            set("createPsArgs", {
                                ...createPsArgs,
                                maxCohortSizeForFitting: Number(e.target.value || 0),
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
                        checked={createPsArgs.errorOnHighCorrelation}
                        onChange={(v) =>
                            set("createPsArgs", {
                                ...createPsArgs,
                                errorOnHighCorrelation: v,
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

                {/* PRIOR / CONTROL: show only when regularization ON (both exist) */}
                {useRegularization && createPsArgs.prior && createPsArgs.control && (
                    <>
                        <SectionCard title="Control Settings">
                            <Field label="Maximum relative change in convergence criterion from successive iterations">
                                <NumInput
                                    step="0.0000001"
                                    value={createPsArgs.control.tolerance}
                                    onChange={(e) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, tolerance: Number(e.target.value) },
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Select the cross validation search type">
                                <Select
                                    value={createPsArgs.control.cvType}
                                    onChange={(v: CvType) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, cvType: v },
                                        })
                                    }
                                    options={["auto"]}
                                />
                            </Field>

                            <Field label="Number of random folds to employ in cross validation">
                                <NumInput
                                    value={createPsArgs.control.fold}
                                    onChange={(e) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, fold: Number(e.target.value || 0) },
                                        })
                                    }
                                    min={1}
                                />
                            </Field>

                            <Field label="Number of repetitions of 10-fold cross validation">
                                <NumInput
                                    value={createPsArgs.control.cvRepetitions}
                                    onChange={(e) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, cvRepetitions: Number(e.target.value || 0) },
                                        })
                                    }
                                    min={1}
                                />
                            </Field>

                            <Field label="Noise level for Cyclops screen output">
                                <Select
                                    value={createPsArgs.control.noiseLevel}
                                    onChange={(v: NoiseLevel) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, noiseLevel: v },
                                        })
                                    }
                                    options={["silent", "quiet", "noisy"]}
                                />
                            </Field>

                            <Field label="Reset all coefficients to 0 between model fits under cross-validation">
                                <YesNoToggle
                                    checked={createPsArgs.control.resetCoefficients}
                                    onChange={(v) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, resetCoefficients: v },
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Starting variance for auto-search cross-validation (-1 mean use estimate based on data)">
                                <NumInput
                                    step="0.0001"
                                    value={createPsArgs.control.startingVariance}
                                    onChange={(e) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            control: { ...createPsArgs.control!, startingVariance: Number(e.target.value) },
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>
                        <SectionCard title="Prior">
                            <Field label="Specify the prior distribution">
                                <Select value={createPsArgs.prior.priorType} onChange={() => { }} options={["laplace"]} />
                            </Field>

                            <Field label="Perform cross-validation to determine prior-variance">
                                <YesNoToggle
                                    checked={createPsArgs.prior.useCrossValidation}
                                    onChange={(v) =>
                                        set("createPsArgs", {
                                            ...createPsArgs,
                                            prior: { ...createPsArgs.prior!, useCrossValidation: v },
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
