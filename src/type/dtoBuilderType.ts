export type Anchor = "cohort start" | "cohort end";
export type RemoveDuplicate = "keep all" | "keep first" | "remove all";
export type CaliperScale = "propensity score" | "standardized" | "standardized logit";
export type BaseSelection = "all" | "target" | "comparator";
export type ModelType = "logistic" | "poisson" | "cox";
export type CvType = "auto" | "grid";
export type NoiseLevel = "silent" | "quiet" | "noisy";

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