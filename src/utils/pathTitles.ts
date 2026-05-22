// src/constants/pathTitles.ts
export type PathTitleRule = {
    /** e.g., "cohortDefinitions.outcomeCohort.*.name" */
    pattern: string;
    /** string or formatter using captured indices from '*' */
    title: string | ((ctx: { indices: number[]; path: string }) => string);
};

// utils/pathTitles.ts
const escapeRegex = (s: string) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const patternToRegExp = (pattern: string) => {
    const parts = pattern.split("*").map(escapeRegex);
    // e.g. "a.*.b.*.c" -> ["a.", ".b.", ".c"] → join("(\\d+)")
    const source = `^${parts.join("(\\d+)")}$`;
    return new RegExp(source);
};


const RULES: PathTitleRule[] = [
    // ---- Top-level ----
    { pattern: "name", title: "Study Name" },

    // ---- Cohort definitions ----
    { pattern: "cohortDefinitions.targetCohort.id", title: "Target Cohort ID" },
    { pattern: "cohortDefinitions.targetCohort.name", title: "Target Cohort Name" },
    { pattern: "cohortDefinitions.comparatorCohort.id", title: "Comparator Cohort ID" },
    { pattern: "cohortDefinitions.comparatorCohort.name", title: "Comparator Cohort Name" },
    {
        pattern: "cohortDefinitions.outcomeCohort.*.id",
        title: ({ indices: [i] }) => `Outcome Cohort #${i + 1} ID`,
    },
    {
        pattern: "cohortDefinitions.outcomeCohort.*.name",
        title: ({ indices: [i] }) => `Outcome Cohort #${i + 1} Name`,
    },

    // ---- Negative control ----
    { pattern: "negativeControlConceptSet.id", title: "Negative Control Concept Set ID" },
    { pattern: "negativeControlConceptSet.name", title: "Negative Control Concept Set Name" },

    // ---- Covariate selection ----
    {
        pattern: "covariateSelection.conceptsToInclude.*.id",
        title: ({ indices: [i] }) => `Concept to Include #${i + 1} ID`,
    },
    {
        pattern: "covariateSelection.conceptsToInclude.*.name",
        title: ({ indices: [i] }) => `Concept to Include #${i + 1} Name`,
    },
    {
        pattern: "covariateSelection.conceptsToExclude.*.id",
        title: ({ indices: [i] }) => `Concept to Exclude #${i + 1} ID`,
    },
    {
        pattern: "covariateSelection.conceptsToExclude.*.name",
        title: ({ indices: [i] }) => `Concept to Exclude #${i + 1} Name`,
    },

    // ---- getDbCohortMethodDataArgs ----
    { pattern: "getDbCohortMethodDataArgs.maxCohortSize", title: "Max Cohort Size" },
    { pattern: "getDbCohortMethodDataArgs.restrictToCommonPeriod", title: "Restrict to Common Period" },
    { pattern: "getDbCohortMethodDataArgs.firstExposureOnly", title: "First Exposure Only" },
    { pattern: "getDbCohortMethodDataArgs.washoutPeriod", title: "Washout Period (days)" },
    { pattern: "getDbCohortMethodDataArgs.removeDuplicateSubjects", title: "Remove Duplicate Subjects" },
    {
        pattern: "getDbCohortMethodDataArgs.studyPeriods.*.description",
        title: ({ indices: [i] }) => `Study Period #${i + 1} Description`,
    },
    {
        pattern: "getDbCohortMethodDataArgs.studyPeriods.*.studyStartDate",
        title: ({ indices: [i] }) => `Study Period #${i + 1} Start Date`,
    },
    {
        pattern: "getDbCohortMethodDataArgs.studyPeriods.*.studyEndDate",
        title: ({ indices: [i] }) => `Study Period #${i + 1} End Date`,
    },

    // ---- createStudyPopArgs ----
    { pattern: "createStudyPopArgs.censorAtNewRiskWindow", title: "Censor at New Risk Window" },
    {
        pattern: "createStudyPopArgs.removeSubjectsWithPriorOutcome",
        title: "Remove Subjects with Prior Outcome",
    },
    { pattern: "createStudyPopArgs.priorOutcomeLookback", title: "Prior Outcome Lookback (days)" },
    {
        pattern: "createStudyPopArgs.timeAtRisks.*.description",
        title: ({ indices: [i] }) => `Time-at-Risk #${i + 1} Description`,
    },
    {
        pattern: "createStudyPopArgs.timeAtRisks.*.riskWindowStart",
        title: ({ indices: [i] }) => `Time-at-Risk #${i + 1} Start Offset`,
    },
    {
        pattern: "createStudyPopArgs.timeAtRisks.*.startAnchor",
        title: ({ indices: [i] }) => `Time-at-Risk #${i + 1} Start Anchor`,
    },
    {
        pattern: "createStudyPopArgs.timeAtRisks.*.riskWindowEnd",
        title: ({ indices: [i] }) => `Time-at-Risk #${i + 1} End Offset`,
    },
    {
        pattern: "createStudyPopArgs.timeAtRisks.*.endAnchor",
        title: ({ indices: [i] }) => `Time-at-Risk #${i + 1} End Anchor`,
    },
    {
        pattern: "createStudyPopArgs.timeAtRisks.*.minDaysAtRisk",
        title: ({ indices: [i] }) => `Time-at-Risk #${i + 1} Min Days at Risk`,
    },

    // ---- psSettings ----
    {
        pattern: "psSettings.*.description",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Description`,
    },
    {
        pattern: "psSettings.*.trimByPsArgs.trimFraction",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Trim Fraction`,
    },
    {
        pattern: "psSettings.*.trimByPsArgs.equipoiseBounds",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Equipoise Bounds`,
    },
    {
        pattern: "psSettings.*.matchOnPsArgs.maxRatio",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Match on PS: Max Ratio`,
    },
    {
        pattern: "psSettings.*.matchOnPsArgs.caliper",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Match on PS: Caliper`,
    },
    {
        pattern: "psSettings.*.matchOnPsArgs.caliperScale",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Match on PS: Caliper Scale`,
    },
    {
        pattern: "psSettings.*.stratifyByPsArgs",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Stratify-by-PS Args`,
    },
    {
        pattern: "psSettings.*.inversePtWeighting",
        title: ({ indices: [i] }) => `PS Setting #${i + 1} Inverse PT Weighting`,
    },

    // ---- createPsArgs ----
    { pattern: "createPsArgs.maxCohortSizeForFitting", title: "PS: Max Cohort Size for Fitting" },
    { pattern: "createPsArgs.errorOnHighCorrelation", title: "PS: Error on High Correlation" },
    { pattern: "createPsArgs.prior.priorType", title: "PS: Prior Type" },
    { pattern: "createPsArgs.prior.useCrossValidation", title: "PS: Prior Use Cross-Validation" },

    { pattern: "createPsArgs.control.tolerance", title: "PS: Control Tolerance" },
    { pattern: "createPsArgs.control.cvType", title: "PS: Control CV Type" },
    { pattern: "createPsArgs.control.fold", title: "PS: Control Folds" },
    { pattern: "createPsArgs.control.cvRepetitions", title: "PS: Control CV Repetitions" },
    { pattern: "createPsArgs.control.noiseLevel", title: "PS: Control Noise Level" },
    { pattern: "createPsArgs.control.resetCoefficients", title: "PS: Control Reset Coefficients" },
    { pattern: "createPsArgs.control.startingVariance", title: "PS: Control Starting Variance" },

    // ---- fitOutcomeModelArgs ----
    {
        pattern: "fitOutcomeModelArgs.outcomeModels.*.description",
        title: ({ indices: [i] }) => `Outcome Model #${i + 1} Description`,
    },
    {
        pattern: "fitOutcomeModelArgs.outcomeModels.*.modelType",
        title: ({ indices: [i] }) => `Outcome Model #${i + 1} Type`,
    },
    {
        pattern: "fitOutcomeModelArgs.outcomeModels.*.useCovariates",
        title: ({ indices: [i] }) => `Outcome Model #${i + 1} Use Covariates`,
    },
    { pattern: "fitOutcomeModelArgs.stratified", title: "Outcome Model Stratified" },

    { pattern: "fitOutcomeModelArgs.prior.priorType", title: "Outcome Model Prior Type" },
    { pattern: "fitOutcomeModelArgs.prior.useCrossValidation", title: "Outcome Model Prior Use Cross-Validation" },

    { pattern: "fitOutcomeModelArgs.control.tolerance", title: "Outcome Control Tolerance" },
    { pattern: "fitOutcomeModelArgs.control.cvType", title: "Outcome Control CV Type" },
    { pattern: "fitOutcomeModelArgs.control.fold", title: "Outcome Control Folds" },
    { pattern: "fitOutcomeModelArgs.control.cvRepetitions", title: "Outcome Control CV Repetitions" },
    { pattern: "fitOutcomeModelArgs.control.noiseLevel", title: "Outcome Control Noise Level" },
    { pattern: "fitOutcomeModelArgs.control.resetCoefficients", title: "Outcome Control Reset Coefficients" },
    { pattern: "fitOutcomeModelArgs.control.startingVariance", title: "Outcome Control Starting Variance" },
];

export function getTitleForPath(path: string): string {
    // exact match first
    const exact = RULES.find((r) => r.pattern === path);
    if (exact) return typeof exact.title === "function" ? exact.title({ indices: [], path }) : exact.title;

    // wildcard match
    for (const r of RULES) {
        if (!r.pattern.includes("*")) continue;
        const re = patternToRegExp(r.pattern);
        const m = path.match(re);
        if (m) {
            const indices = m.slice(1).map((n) => Number(n));
            return typeof r.title === "function" ? r.title({ indices, path }) : r.title;
        }
    }

    // fallback: show raw path
    return path;
}
