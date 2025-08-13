import { StudyDTO } from "@/type/dtoBuilderType";

export const yyyymmdd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
};

export const fromHtmlDate = (val: string) => val.replaceAll("-", "");
export const toHtmlDate = (yyyymmddStr: string) =>
    yyyymmddStr && yyyymmddStr.length === 8
        ? `${yyyymmddStr.slice(0, 4)}-${yyyymmddStr.slice(4, 6)}-${yyyymmddStr.slice(6, 8)}`
        : "";

export const defaultDTO: StudyDTO = {
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
