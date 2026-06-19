const R_TIMEOUT_MS = 300_000;

interface ExecRResult {
    json: string;
    log: string;
}

/**
 * Send an R script to the remote Plumber API server for execution
 * and return the generated JSON content.
 *
 * Throws on execution failure with the error log as the message.
 */
export async function execRscript(scriptContent: string): Promise<ExecRResult> {
    const plumberUrl = process.env.R_PLUMBER_URL;
    if (!plumberUrl) {
        throw new Error(
            "R_PLUMBER_URL is not set. Configure the remote R Plumber server URL in .env"
        );
    }

    const res = await fetch(`${plumberUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptContent }),
        signal: AbortSignal.timeout(R_TIMEOUT_MS),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.log || data.error || "R script execution failed");
    }

    return { json: data.json, log: data.log ?? "" };
}
