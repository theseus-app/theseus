import { StudyDTO } from "@/types/dtoBuilderType";

export const yyyymmdd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
};

export const fromHtmlDate = (val: string) => val.replaceAll("-", "");
export const toHtmlDate = (yyyymmddStr: string | null) =>
    yyyymmddStr && yyyymmddStr.length === 8
        ? `${yyyymmddStr.slice(0, 4)}-${yyyymmddStr.slice(4, 6)}-${yyyymmddStr.slice(6, 8)}`
        : "";

export const defaultDTO: StudyDTO = {
    name: "",
    cohortDefinitions: {
        targetCohort: { id: 1794126, name: "Ticagrelor" },
        comparatorCohort: { id: 1794132, name: "Clopidogrel" },
        outcomeCohort: [{ id: 1794131, name: "Acute myocardial infarction events" }],
    },
    negativeControlConceptSet: { id: null, name: "" },
    covariateSelection: {
        conceptsToInclude: [{ id: null, name: "" }],
        conceptsToExclude: [{ id: null, name: "" }],
    },
    getDbCohortMethodDataArgs: {
        studyPeriods: [
            {
                description: "",
                studyStartDate: null,
                studyEndDate: null,
            },
        ],
        firstExposureOnly: false,
        removeDuplicateSubjects: "keep all",
        restrictToCommonPeriod: false,
        washoutPeriod: 365,
        maxCohortSize: 0,
    },
    createStudyPopArgs: {
        removeSubjectsWithPriorOutcome: true,
        priorOutcomeLookback: 99999,
        timeAtRisks: [
            {
                description: "",
                minDaysAtRisk: 1,
                riskWindowStart: 1,
                startAnchor: "cohort start",
                riskWindowEnd: 0,
                endAnchor: "cohort end",
            },
        ],
        censorAtNewRiskWindow: false,
    },
    psSettings: [
        {
            description: "PS 1",
            trimByPsArgs: null,
            matchOnPsArgs: { maxRatio: 1, caliper: 0.2, caliperScale: "standardized logit" },
            stratifyByPsArgs: null,
            inversePtWeighting: false,
        },
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
    fitOutcomeModelArgs: {
        outcomeModels: [
            {
                description: "",
                modelType: "cox",
                useCovariates: false,
            },
        ],
        stratified: false,
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
