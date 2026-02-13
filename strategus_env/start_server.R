renv_lib <- Sys.glob("/opt/json2strategus-core/renv/library/*/R-*/*/")[1]
.libPaths(c(renv_lib, .libPaths()))

library(plumber)
pr <- plumb("/opt/json2strategus-core/plumber.R")
pr$run(host = "0.0.0.0", port = 8787)
