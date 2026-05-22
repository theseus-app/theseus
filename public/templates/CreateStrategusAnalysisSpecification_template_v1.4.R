################################################################################
# v1.4 — Updated for new cmAnalysis DTO structure (migration A8).
# Key changes vs previous template:
#   C1: restrictToCommonPeriod / firstExposureOnly / washoutPeriod /
#       removeDuplicateSubjects now read from getDbCohortMethodDataArgs
#       (not createStudyPopArgs).
#   C2: studyPeriods tibble now includes a description column.
#   C3: psSettings read at top level (no propensityScoreAdjustment. prefix);
#       createPsArgs likewise at top level.
#   C4: trimByPsArgs / inversePtWeighting placeholders — see TODO comments.
#   C5: fitOutcomeModelArgs.outcomeModels[] array; one model used per analysis
#       iteration (matching existing single-analysis multiplicity).
#   C6: priorOutcomeLookback (lowercase b) confirmed throughout.
#
# See the Create analysis specifications section
# of the UsingThisTemplate.md for more details.
#
# More information about Strategus HADES modules can be found at:
# https://ohdsi.github.io/Strategus/reference/index.html#omop-cdm-hades-modules.
# This help page also contains links to the corresponding HADES package that
# further details.
# ##############################################################################
renv::restore(prompt = FALSE) # must call "renv::restore()" to install all of the necessary R libraries
library(dplyr)
library(Strategus)

# Shared Resources -------------------------------------------------------------
# Get the list of cohorts
baseUrl <- "https://atlas-demo.ohdsi.org/WebAPI"

# Cohort Definitions
cohortDefinitionSet <- ROhdsiWebApi::exportCohortDefinitionSet(
  baseUrl = baseUrl,
  cohortIds = c(
    0000000, # Target: 
    1111111, # Comparator: 
    2222222 # Outcome: 
  ),
  generateStats = TRUE
)

# Re-number cohorts
cohortDefinitionSet[cohortDefinitionSet$cohortId == 0000000,]$cohortId <- 1
cohortDefinitionSet[cohortDefinitionSet$cohortId == 1111111,]$cohortId <- 2
cohortDefinitionSet[cohortDefinitionSet$cohortId == 2222222,]$cohortId <- 3

# Negative control outcomes
negativeControlOutcomeCohortSet <- ROhdsiWebApi::getConceptSetDefinition(
  conceptSetId = 1234567,
  baseUrl = baseUrl
) %>%
  ROhdsiWebApi::resolveConceptSet(
    baseUrl = baseUrl
  ) %>%
  ROhdsiWebApi::getConcepts(
    baseUrl = baseUrl
  ) %>%
  rename(outcomeConceptId = "conceptId",
         cohortName = "conceptName") %>%
  mutate(cohortId = row_number() + 100) %>% # target/comparator cohort ids start with 1, 2, 3... negativeControl -> 101, 102, 103...
  select(cohortId, cohortName, outcomeConceptId)


if (any(duplicated(cohortDefinitionSet$cohortId, negativeControlOutcomeCohortSet$cohortId))) {
  stop("*** Error: duplicate cohort IDs found ***")
}

# Create some data frames to hold the cohorts we'll use in each analysis ---------------
# Outcomes: 
oList <- cohortDefinitionSet %>%
  filter(.data$cohortId == 3) %>%
  mutate(outcomeCohortId = cohortId, outcomeCohortName = cohortName) %>%
  select(outcomeCohortId, outcomeCohortName) %>%
  mutate(cleanWindow = 365)

# Target and Comparator for the CohortMethod analysis 
cmTcList <- data.frame(
  targetCohortId = 1,
  targetCohortName = "target cohort name",
  comparatorCohortId = 2,
  comparatorCohortName = "comparator cohort name"
)

# For the CohortMethod LSPS we'll need to exclude the drugs of interest in this
# study
excludedCovariateConcepts <- data.frame(
  conceptId = c(2345678, 3456789),
  conceptName = c("target concept name", "comparator concept name")
)

# Optional: If you want to define covariates to include instead of including them all
# includedCovariateConcepts <- data.frame(
#   conceptId = c(),
#   conceptName = c()
# )

# CohortGeneratorModule --------------------------------------------------------
cgModuleSettingsCreator <- CohortGeneratorModule$new()
cohortDefinitionShared <- cgModuleSettingsCreator$createCohortSharedResourceSpecifications(cohortDefinitionSet)
negativeControlsShared <- cgModuleSettingsCreator$createNegativeControlOutcomeCohortSharedResourceSpecifications(
  negativeControlOutcomeCohortSet = negativeControlOutcomeCohortSet,
  occurrenceType = "first",
  detectOnDescendants = TRUE
)
cohortGeneratorModuleSpecifications <- cgModuleSettingsCreator$createModuleSpecifications(
  generateStats = TRUE
)

# CohortDiagnoticsModule Settings ---------------------------------------------
cdModuleSettingsCreator <- CohortDiagnosticsModule$new()
cohortDiagnosticsModuleSpecifications <- cdModuleSettingsCreator$createModuleSpecifications(
  cohortIds = cohortDefinitionSet$cohortId,
  runInclusionStatistics = TRUE,
  runIncludedSourceConcepts = TRUE,
  runOrphanConcepts = TRUE,
  runTimeSeries = FALSE,
  runVisitContext = TRUE,
  runBreakdownIndexEvents = TRUE,
  runIncidenceRate = TRUE,
  runCohortRelationship = TRUE,
  runTemporalCohortCharacterization = TRUE,
  minCharacterizationMean = 0.01
)

# CohortMethodModule -----------------------------------------------------------

# If you are not restricting your study to a specific time window,
# please make these strings empty (and description can be empty string "").
# C2: description field added per new getDbCohortMethodDataArgs.studyPeriods[].description
studyPeriods <- tibble(
  description    = c(), # human-readable label for this study window
  studyStartDate = c(), #YYYYMMDD
  studyEndDate   = c()  #YYYYMMDD
)

# Time-at-risks (TARs) for the outcomes of interest in your study
# (from createStudyPopArgs.timeAtRisks[] in the new DTO)
timeAtRisks <- tibble(
  description     = c(), # human-readable label for this TAR
  riskWindowStart = c(),
  startAnchor     = c(), # "cohort start" | "cohort end"
  riskWindowEnd   = c(),
  endAnchor       = c(), # "cohort start" | "cohort end"
  minDaysAtRisk   = c()  # minimum days at risk; default 1
)

# C3: psSettings read at top level (new DTO: psSettings[], NOT propensityScoreAdjustment.psSettings).
# Each entry corresponds to one psSettingSchema object:
#   description      — human-readable label
#   trimByPsArgs     — list(trimFraction, equipoiseBounds) or NULL
#   matchOnPsArgs    — list(maxRatio, caliper, caliperScale) or NULL
#   stratifyByPsArgs — list(numberOfStrata, baseSelection) or NULL
#   inversePtWeighting — TRUE/FALSE
#
# Build a single PS configuration list (each entry mirrors one psSettings element).
psConfigList <- list()

# *** POPULATE psConfigList FROM psSettings[] HERE ***
# Example (fill in values from your analysis specification):
#
# psConfigList[[1]] <- list(
#   description      = "Match 1:1 on PS",
#   matchOnPsArgs    = list(maxRatio = 1, caliper = 0.2, caliperScale = "standardized logit"),
#   stratifyByPsArgs = NULL,
#   trimByPsArgs     = NULL,   # or list(trimFraction = 0.05, equipoiseBounds = NULL)
#   inversePtWeighting = FALSE
# )
#
# psConfigList[[2]] <- list(
#   description      = "Stratify by PS (10 strata)",
#   matchOnPsArgs    = NULL,
#   stratifyByPsArgs = list(numberOfStrata = 10, baseSelection = "all"),
#   trimByPsArgs     = NULL,
#   inversePtWeighting = FALSE
# )


# Iterate through all analysis setting combinations
cmAnalysisList <- list()
analysisId <- 1

for (s in seq_len(nrow(studyPeriods))) {
  # C2: studyPeriods now carries a description alongside the date window
  studyPeriodDesc  <- studyPeriods$description[s]
  studyStartDate   <- studyPeriods$studyStartDate[s]
  studyEndDate     <- studyPeriods$studyEndDate[s]

  for (t in seq_len(nrow(timeAtRisks))) {

    for (p in seq_along(psConfigList)) {
      # C3: psCfg now directly mirrors a psSettings[] element (top-level in DTO).
      psCfg <- psConfigList[[p]]

      # Resolve matchOnPsArgs / stratifyByPsArgs from the new structure
      if (!is.null(psCfg$matchOnPsArgs)) {
        matchOnPsArgs <- CohortMethod::createMatchOnPsArgs(
          maxRatio             = psCfg$matchOnPsArgs$maxRatio,
          caliper              = psCfg$matchOnPsArgs$caliper,
          caliperScale         = psCfg$matchOnPsArgs$caliperScale,
          allowReverseMatch    = FALSE,
          stratificationColumns = c()
        )
        stratifyByPsArgs <- NULL
      } else if (!is.null(psCfg$stratifyByPsArgs)) {
        matchOnPsArgs <- NULL
        stratifyByPsArgs <- CohortMethod::createStratifyByPsArgs(
          numberOfStrata        = psCfg$stratifyByPsArgs$numberOfStrata,
          stratificationColumns = c(),
          baseSelection         = psCfg$stratifyByPsArgs$baseSelection
        )
      } else {
        matchOnPsArgs    <- NULL
        stratifyByPsArgs <- NULL
      }

      # C4: trimByPsArgs and inversePtWeighting are new psSetting fields.
      # TODO(Workstream C): map trimByPsArgs/inversePtWeighting to CohortMethod args
      #   — needs OHDSI/Strategus domain verification before implementation.
      #   psCfg$trimByPsArgs       : list(trimFraction, equipoiseBounds) or NULL
      #   psCfg$inversePtWeighting : TRUE/FALSE
      # When confirmed, wire trimByPsArgs into CohortMethod::createTrimByPsArgs() (if it exists)
      # and pass inversePtWeighting into createFitOutcomeModelArgs(inversePtWeighting = ...).
      trimByPsArgs <- NULL  # placeholder — replace when API slot is confirmed

      covariateSettings <- FeatureExtraction::createDefaultCovariateSettings(
        addDescendantsToExclude = TRUE
      )

      outcomeList <- append(
        lapply(seq_len(nrow(oList)), function(i) {
          CohortMethod::createOutcome(
            outcomeId = oList$outcomeCohortId[i],
            outcomeOfInterest = TRUE,
            trueEffectSize = NA,
            priorOutcomeLookback = 99999
          )
        }),
        lapply(negativeControlOutcomeCohortSet$cohortId, function(i) {
          CohortMethod::createOutcome(
            outcomeId = i,
            outcomeOfInterest = FALSE,
            trueEffectSize = 1
          )
        })
      )
      targetComparatorOutcomesList <- list()
      for (i in seq_len(nrow(cmTcList))) {
        targetComparatorOutcomesList[[i]] <- CohortMethod::createTargetComparatorOutcomes(
          targetId = cmTcList$targetCohortId[i],
          comparatorId = cmTcList$comparatorCohortId[i],
          outcomes = outcomeList,
          excludedCovariateConceptIds = c(
            cmTcList$targetConceptId[i], 
            cmTcList$comparatorConceptId[i],
            excludedCovariateConcepts$conceptId
          )
        )
      }

      # C1: restrictToCommonPeriod / firstExposureOnly / washoutPeriod /
      #     removeDuplicateSubjects now live in getDbCohortMethodDataArgs (new DTO).
      # These fields were previously in createStudyPopArgs; the hardcoded
      # restrictToCommonPeriod = TRUE is replaced by the value from the DTO field.
      getDbCohortMethodDataArgs <- CohortMethod::createGetDbCohortMethodDataArgs(
        restrictToCommonPeriod  = FALSE, # set from getDbCohortMethodDataArgs.restrictToCommonPeriod
        firstExposureOnly       = FALSE, # set from getDbCohortMethodDataArgs.firstExposureOnly
        washoutPeriod           = 0,     # set from getDbCohortMethodDataArgs.washoutPeriod
        removeDuplicateSubjects = "keep first", # set from getDbCohortMethodDataArgs.removeDuplicateSubjects
        studyStartDate          = studyStartDate,
        studyEndDate            = studyEndDate,
        maxCohortSize           = 0,     # set from getDbCohortMethodDataArgs.maxCohortSize
        covariateSettings       = covariateSettings
      )

      # C3: createPsArgs is at top level in the new DTO (not under propensityScoreAdjustment.).
      createPsArgs = CohortMethod::createCreatePsArgs(
        maxCohortSizeForFitting = 250000, # from createPsArgs.maxCohortSizeForFitting
        errorOnHighCorrelation  = TRUE,   # from createPsArgs.errorOnHighCorrelation
        stopOnError = FALSE, # Setting to FALSE to allow Strategus complete all CM operations; when we cannot fit a model, the equipoise diagnostic should fail
        estimator = "att",
        prior = Cyclops::createPrior( # prior = NULL if createPsArgs.prior == null
          priorType = "laplace",
          exclude = c(0),
          useCrossValidation = TRUE
        ),
        control = Cyclops::createControl( # control = NULL if createPsArgs.control == null
          noiseLevel = "silent",
          cvType = "auto",
          seed = 1,
          resetCoefficients = TRUE,
          tolerance = 2e-07,
          cvRepetitions = 1,
          startingVariance = 0.01
        )
      )

      computeSharedCovariateBalanceArgs = CohortMethod::createComputeCovariateBalanceArgs(
        maxCohortSize = 250000,
        covariateFilter = NULL
      )
      computeCovariateBalanceArgs = CohortMethod::createComputeCovariateBalanceArgs(
        maxCohortSize = 250000,
        covariateFilter = FeatureExtraction::getDefaultTable1Specifications()
      )

      # C5: fitOutcomeModelArgs.outcomeModels[] is now an array in the new DTO.
      # The top-level fitOutcomeModelArgs fields (stratified, prior, control) are shared;
      # modelType and useCovariates come from each outcomeModels[] entry.
      # This template uses the first entry (outcomeModels[1]) to match the existing
      # single-analysis-per-loop-iteration multiplicity. Full multi-model cross-product
      # expansion is deferred to Workstream C.
      #
      # To adapt for multiple outcome models, iterate outcomeModels[] here and
      # emit one cmAnalysis per model (or combine as needed).
      fitOutcomeModelArgs = CohortMethod::createFitOutcomeModelArgs(
        modelType          = "cox",   # from fitOutcomeModelArgs.outcomeModels[1].modelType
        stratified         = TRUE,    # from fitOutcomeModelArgs.stratified
        useCovariates      = FALSE,   # from fitOutcomeModelArgs.outcomeModels[1].useCovariates
        # C4/C5 NOTE: inversePtWeighting comes from psSettings[p].inversePtWeighting (new field).
        # TODO(Workstream C): pass psCfg$inversePtWeighting here once domain-verified.
        inversePtWeighting = FALSE,
        prior = Cyclops::createPrior( # prior = NULL if fitOutcomeModelArgs.prior == null
          priorType = "laplace",
          useCrossValidation = TRUE
        ),
        control = Cyclops::createControl( # control = NULL if fitOutcomeModelArgs.control == null
          cvType = "auto",
          seed = 1,
          resetCoefficients = TRUE,
          startingVariance = 0.01,
          tolerance = 2e-07,
          cvRepetitions = 1,
          noiseLevel = "quiet"
        )
      )
      # C1: restrictToCommonPeriod / firstExposureOnly / washoutPeriod /
      #     removeDuplicateSubjects have moved to getDbCohortMethodDataArgs (above).
      #     createStudyPopArgs now only holds the fields that remain in
      #     createStudyPopArgs per the new DTO.
      # C6: priorOutcomeLookback spelling confirmed lowercase 'b'.
      createStudyPopArgs <- CohortMethod::createCreateStudyPopulationArgs(
        censorAtNewRiskWindow          = TRUE,  # from createStudyPopArgs.censorAtNewRiskWindow
        removeSubjectsWithPriorOutcome = TRUE,  # from createStudyPopArgs.removeSubjectsWithPriorOutcome
        priorOutcomeLookback           = 99999, # from createStudyPopArgs.priorOutcomeLookback (lowercase b — C6)
        riskWindowStart = timeAtRisks$riskWindowStart[t],
        startAnchor     = timeAtRisks$startAnchor[t],
        riskWindowEnd   = timeAtRisks$riskWindowEnd[t],
        endAnchor       = timeAtRisks$endAnchor[t],
        minDaysAtRisk   = timeAtRisks$minDaysAtRisk[t], # from createStudyPopArgs.timeAtRisks[].minDaysAtRisk
        maxDaysAtRisk   = 99999
      )


      # Append the settings to Analysis List
      # C2/C3: description now uses studyPeriods$description, timeAtRisks$description,
      # and psCfg$description (from psSettings[].description in the new DTO).
      cmAnalysisList[[analysisId]] <- CohortMethod::createCmAnalysis(
        analysisId = analysisId,
        description = sprintf(
          "Study: %s; TAR: %s; PS: %s",
          studyPeriodDesc,
          timeAtRisks$description[t],
          psCfg$description
        ),
        getDbCohortMethodDataArgs = getDbCohortMethodDataArgs,
        createStudyPopArgs = createStudyPopArgs,
        createPsArgs = createPsArgs,
        matchOnPsArgs = matchOnPsArgs,
        stratifyByPsArgs = stratifyByPsArgs,
        computeSharedCovariateBalanceArgs = computeSharedCovariateBalanceArgs,
        computeCovariateBalanceArgs = computeCovariateBalanceArgs,
        fitOutcomeModelArgs = fitOutcomeModelArgs
      )
      analysisId <- analysisId + 1
    }
  }
}

cmModuleSettingsCreator <- CohortMethodModule$new()
cohortMethodModuleSpecifications <- cmModuleSettingsCreator$createModuleSpecifications(
  cmAnalysisList = cmAnalysisList,
  targetComparatorOutcomesList = targetComparatorOutcomesList,
  analysesToExclude = NULL,
  refitPsForEveryOutcome = FALSE,
  refitPsForEveryStudyPopulation = FALSE,  
  cmDiagnosticThresholds = CohortMethod::createCmDiagnosticThresholds()
)

# Create the analysis specifications ------------------------------------------
analysisSpecifications <- Strategus::createEmptyAnalysisSpecificiations() |>
  Strategus::addSharedResources(cohortDefinitionShared) |> 
  Strategus::addSharedResources(negativeControlsShared) |>
  Strategus::addModuleSpecifications(cohortGeneratorModuleSpecifications) |>
  Strategus::addModuleSpecifications(cohortDiagnosticsModuleSpecifications) |>
  Strategus::addModuleSpecifications(cohortMethodModuleSpecifications)

# Path to save file
outPath <- file.path("inst", "studyName")
outFile <- file.path(outPath, "studyNameAnalysisSpecification.json")
 
if (!dir.exists(outPath)) {
  dir.create(outPath, recursive = TRUE)
}

ParallelLogger::saveSettingsToJson(
  analysisSpecifications, 
  file.path("inst", "studyName", "studyNameAnalysisSpecification.json")
)