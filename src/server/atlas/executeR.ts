import { execFile } from "child_process";
import { mkdtemp, writeFile, readFile, rm, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const R_TIMEOUT_MS = 90_000;

/**
 * Discover the renv library path inside json2strategus-core/.
 * The path pattern is: renv/library/{os}/{R-version}/{arch}/
 * We walk the directory tree to find it dynamically.
 */
async function resolveRenvLibPath(): Promise<string> {
    const base = join(process.cwd(), "json2strategus-core", "renv", "library");
    try {
        const osDirs = await readdir(base);
        for (const osDir of osDirs) {
            const osPath = join(base, osDir);
            const rVersions = await readdir(osPath);
            for (const rVer of rVersions) {
                const rVerPath = join(osPath, rVer);
                const archs = await readdir(rVerPath);
                for (const arch of archs) {
                    const libPath = join(rVerPath, arch);
                    return libPath;
                }
            }
        }
    } catch {
        // fall through
    }
    throw new Error(
        "Could not find renv library in json2strategus-core/renv/library/. " +
        "Run renv::restore() inside json2strategus-core/ first."
    );
}

/** Check if `Rscript` binary is available on the system. */
export async function checkRAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        execFile("Rscript", ["--version"], (err) => {
            resolve(!err);
        });
    });
}

/**
 * Replace the `outputJsonPath <- ...` line in the R script
 * so the generated JSON goes to our temp directory.
 */
export function patchOutputPath(script: string, outputPath: string): string {
    const escaped = outputPath.replace(/\\/g, "/");
    return script.replace(
        /^outputJsonPath\s*<-\s*.+$/m,
        `outputJsonPath <- "${escaped}"`
    );
}

export interface ExecRResult {
    json: string;
    log: string;
}

/**
 * Write an R script to a temp file, execute it via `Rscript`,
 * and return the generated JSON content.
 *
 * Throws on R execution failure with the stderr/stdout as the error message.
 */
export async function execRscript(scriptContent: string): Promise<ExecRResult> {
    const available = await checkRAvailable();
    if (!available) {
        throw new Error(
            "Rscript is not installed or not found in PATH. " +
            "R and renv are required to build JSON locally."
        );
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "strategus-"));
    const scriptPath = join(tmpDir, "CreateStrategusAnalysisSpecification.R");
    const jsonPath = join(tmpDir, "analysisSpecification.json");

    const patched = patchOutputPath(scriptContent, jsonPath);

    try {
        await writeFile(scriptPath, patched, "utf8");

        const cwd = join(process.cwd(), "json2strategus-core");
        const rLibsUser = await resolveRenvLibPath();
        const log = await new Promise<string>((resolve, reject) => {
            execFile(
                "Rscript",
                [scriptPath],
                {
                    cwd,
                    timeout: R_TIMEOUT_MS,
                    env: {
                        ...process.env,
                        RENV_CONFIG_AUTOLOADER_ENABLED: "FALSE",
                        R_LIBS_USER: rLibsUser,
                    },
                },
                (error, stdout, stderr) => {
                    const combined = [stdout, stderr].filter(Boolean).join("\n");
                    if (error) {
                        reject(new Error(combined || error.message));
                    } else {
                        resolve(combined);
                    }
                }
            );
        });

        const json = await readFile(jsonPath, "utf8");
        return { json, log };
    } finally {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
}
