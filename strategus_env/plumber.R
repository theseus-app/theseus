library(plumber)

#* Health check
#* @get /health
function() {
  list(status = "ok", r_version = R.version.string)
}

#* Execute R script and return generated JSON
#* @param script:character The R script content
#* @post /execute
function(req, res, script = "") {
  if (nchar(script) == 0) {
    res$status <- 400L
    return(list(error = "script is required"))
  }

  tmp_dir <- tempfile("strategus-")
  dir.create(tmp_dir)
  script_path <- file.path(tmp_dir, "CreateStrategusAnalysisSpecification.R")
  json_path <- file.path(tmp_dir, "analysisSpecification.json")

  # Patch the script to redirect JSON output to our temp path.
  # Try multiple patterns that LLM or rule-based scripts might use.
  patched <- script

  # Pattern 1: outputJsonPath <- "..."
  patched <- sub(
    'outputJsonPath\\s*<-\\s*.+',
    sprintf('outputJsonPath <- "%s"', json_path),
    patched
  )

  # Pattern 2: ParallelLogger::saveSettingsToJson(analysisSpecifications, file.path(...))
  patched <- sub(
    'ParallelLogger::saveSettingsToJson\\s*\\(\\s*analysisSpecifications\\s*,\\s*[^)]+\\)',
    sprintf('ParallelLogger::saveSettingsToJson(analysisSpecifications, "%s")', json_path),
    patched
  )

  # Pattern 3: saveSettingsToJson(analysisSpecifications, "...")
  patched <- sub(
    'saveSettingsToJson\\s*\\(\\s*analysisSpecifications\\s*,\\s*"[^"]*"\\s*\\)',
    sprintf('saveSettingsToJson(analysisSpecifications, "%s")', json_path),
    patched
  )

  writeLines(patched, script_path)

  renv_lib <- Sys.glob("/opt/json2strategus-core/renv/library/*/R-*/*/")[1]

  result <- tryCatch({
    output <- system2(
      "Rscript", script_path,
      env = c(
        "RENV_CONFIG_AUTOLOADER_ENABLED=FALSE",
        paste0("R_LIBS_USER=", renv_lib)
      ),
      stdout = TRUE, stderr = TRUE,
      timeout = 300
    )
    log_text <- paste(output, collapse = "\n")

    if (!file.exists(json_path)) {
      res$status <- 422L
      return(list(error = "R script did not produce JSON output", log = log_text))
    }

    json_content <- readLines(json_path, warn = FALSE)
    list(json = paste(json_content, collapse = "\n"), log = log_text)
  }, error = function(e) {
    res$status <- 422L
    list(error = e$message, log = "")
  }, finally = {
    unlink(tmp_dir, recursive = TRUE)
  })

  result
}
