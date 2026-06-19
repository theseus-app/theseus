"use client";
import React, { useState } from "react";
import { Field } from "@/components/primitive";
import copyToClipboard from "@/utils/copyToClipboard";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";
import { sleep } from "@/utils/sleep";

const MAX_DEBUG_ATTEMPTS = 3;

/** 프레젠테이션 컴포넌트: 훅 없음 */
function PreviewSectionCardView(props: {
    jsonPretty: string;
    strategusScript: string;
    loading: boolean;
    error: string | null;
    onCopyJson: () => void;
    onConvert: () => void;
    onCopyStrategus: () => void;
    onLoadExample: () => void;
    buildingJson: boolean;
    debugging: boolean;
    generatedJson: string;
    errorLog: string;
    buildError: string | null;
    debugAttempt: number;
    onBuildJson: () => void;
    onDebug: () => void;
    onCopyGeneratedJson: () => void;
    onDownloadGeneratedJson: () => void;
    errorLogExpanded: boolean;
    onToggleErrorLog: () => void;
}) {
    const {
        jsonPretty,
        strategusScript,
        loading,
        error,
        onCopyJson,
        onConvert,
        onCopyStrategus,
        onLoadExample,
        buildingJson,
        debugging,
        generatedJson,
        errorLog,
        buildError,
        debugAttempt,
        onBuildJson,
        onDebug,
        onCopyGeneratedJson,
        onDownloadGeneratedJson,
        errorLogExpanded,
        onToggleErrorLog,
    } = props;

    const anyLoading = loading || buildingJson || debugging;

    return (
        <Field title="LLM-powered Strategus R code generated" label="Uses an LLM to convert the current UI into Strategus-ready R code for analysis.">
            <div className="flex gap-2 items-center">
                <button
                    className="px-4 py-2 rounded-[4px] bg-gray-200 text-black cursor-pointer disabled:opacity-60"
                    onClick={onLoadExample}
                    disabled={anyLoading}
                >
                    Load Example
                </button>
                <button
                    className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                    onClick={onConvert}
                    disabled={anyLoading || !jsonPretty}
                    title="Convert ATLAS spec JSON to Strategus R"
                >
                    {loading ? "Converting..." : "Convert to Strategus Code"}
                </button>
            </div>

            {strategusScript && (
                <Field title="LLM-generated Strategus Code">
                    <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                        {strategusScript}
                    </pre>
                    <div className="flex gap-2 items-center">
                        <button
                            className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                            onClick={onCopyStrategus}
                        >
                            Copy Code
                        </button>
                        <button
                            className="px-4 py-2 rounded-[4px] bg-green-600 text-white cursor-pointer disabled:opacity-60"
                            onClick={onBuildJson}
                            disabled={anyLoading}
                        >
                            {buildingJson ? "Building..." : "Build JSON"}
                        </button>
                        {errorLog && debugAttempt < MAX_DEBUG_ATTEMPTS && (
                            <button
                                className="px-4 py-2 rounded-[4px] bg-amber-600 text-white cursor-pointer disabled:opacity-60"
                                onClick={onDebug}
                                disabled={anyLoading}
                            >
                                {debugging ? "Debugging..." : `Debug & Retry (${debugAttempt}/${MAX_DEBUG_ATTEMPTS})`}
                            </button>
                        )}
                    </div>
                </Field>
            )}

            {buildError && (
                <div className="mt-2">
                    <p className="text-sm text-red-600">{buildError}</p>
                </div>
            )}

            {errorLog && (
                <div className="mt-2">
                    <button
                        className="text-xs text-red-500 underline cursor-pointer mb-1"
                        onClick={onToggleErrorLog}
                    >
                        {errorLogExpanded ? "Hide Error Log" : "Show Error Log"}
                    </button>
                    {errorLogExpanded && (
                        <pre className="text-xs bg-red-950 text-red-300 rounded-xl p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                            {errorLog}
                        </pre>
                    )}
                </div>
            )}

            {generatedJson && (
                <Field title="Generated analysisSpecification.json">
                    <pre className="text-xs bg-gray-900 text-blue-300 rounded-xl p-3 overflow-auto max-h-64 whitespace-pre-wrap">
                        {generatedJson}
                    </pre>
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                            onClick={onCopyGeneratedJson}
                        >
                            Copy JSON
                        </button>
                        <button
                            className="px-4 py-2 rounded-[4px] bg-gray-700 text-white cursor-pointer disabled:opacity-60"
                            onClick={onDownloadGeneratedJson}
                        >
                            Download JSON
                        </button>
                    </div>
                </Field>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Field>
    );
}

/** Container Component (call hook here) */
function PreviewSectionCardContainer() {
    const { study } = useStore(); // 1
    const [loading, setLoading] = useState(false); // 2
    const [error, setError] = useState<string | null>(null); // 3
    const [strategusScript, setStrategusScript] = useState<string>(""); // 4

    const [buildingJson, setBuildingJson] = useState(false);
    const [debugging, setDebugging] = useState(false);
    const [generatedJson, setGeneratedJson] = useState("");
    const [errorLog, setErrorLog] = useState("");
    const [buildError, setBuildError] = useState<string | null>(null);
    const [debugAttempt, setDebugAttempt] = useState(0);
    const [errorLogExpanded, setErrorLogExpanded] = useState(false);

    const { user } = useStore()
    // const apiKey = user.apiKey
    const jsonPretty = typeof study?.jsonPretty === "string" ? study.jsonPretty : "";

    const onCopyJson = async () => {
        await copyToClipboard(jsonPretty);
    };

    const onCopyStrategus = async () => {
        const ok = await copyToClipboard(strategusScript);

    };

    const onCopyGeneratedJson = async () => {
        await copyToClipboard(generatedJson);
    };

    const onDownloadGeneratedJson = () => {
        const blob = new Blob([generatedJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "analysisSpecification.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadExampleScript = async () => {
        try {
            setError(null);
            setLoading(true);

            const res = await fetch(
                "/examples/TICAGRELOR_CLOPIDOGREL_SCRIPTS.R"
            );

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`Example script ${res.status}: ${t}`);
            }

            const scriptText = await res.text();

            await sleep(3000);

            setStrategusScript(scriptText);
            // Reset build state when loading a new script
            setGeneratedJson("");
            setErrorLog("");
            setBuildError(null);
            setDebugAttempt(0);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load example Strategus script");
        } finally {
            setLoading(false);
        }
    };

    const onConvert = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/atlas/json2strategus", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-api-key": process.env.OPENAI_API_KEY ?? ""
                },
                body: JSON.stringify({ analysisSpecifications: jsonPretty }),
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`API ${res.status}: ${t}`);
            }
            const { script } = (await res.json()) as { script: string };
            setStrategusScript(script);
            // Reset build state when generating a new script
            setGeneratedJson("");
            setErrorLog("");
            setBuildError(null);
            setDebugAttempt(0);
        } catch (e: any) {
            setError(e?.message ?? "Failed to convert to Strategus script");
        } finally {
            setLoading(false);
        }
    };

    const buildJson = async (scriptOverride?: string) => {
        const script = scriptOverride ?? strategusScript;
        setBuildingJson(true);
        setBuildError(null);
        setGeneratedJson("");
        setErrorLog("");
        setErrorLogExpanded(false);
        try {
            const res = await fetch("/api/atlas/execute-r", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ script }),
            });
            const data = await res.json();
            if (!res.ok) {
                setBuildError(data.error ?? "R script execution failed");
                setErrorLog(data.errorLog ?? "");
                setErrorLogExpanded(true);
                return;
            }
            setGeneratedJson(data.json);
            setErrorLog("");
            setBuildError(null);
        } catch (e: any) {
            setBuildError(e?.message ?? "Failed to build JSON");
        } finally {
            setBuildingJson(false);
        }
    };

    const onBuildJson = () => {
        setDebugAttempt(0);
        buildJson();
    };

    const onDebug = async () => {
        if (debugAttempt >= MAX_DEBUG_ATTEMPTS) return;
        setDebugging(true);
        setBuildError(null);
        try {
            const res = await fetch("/api/atlas/debug-strategus", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    originalScript: strategusScript,
                    errorLog,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setBuildError(data.error ?? "Debug request failed");
                return;
            }
            const fixedScript = data.script as string;
            setStrategusScript(fixedScript);
            setDebugAttempt((prev) => prev + 1);

            // Auto-retry build with fixed script
            setDebugging(false);
            await buildJson(fixedScript);
            return;
        } catch (e: any) {
            setBuildError(e?.message ?? "Failed to debug script");
        } finally {
            setDebugging(false);
        }
    };

    return (
        <PreviewSectionCardView
            jsonPretty={jsonPretty}
            strategusScript={strategusScript}
            loading={loading}
            error={error}
            onCopyJson={onCopyJson}
            onConvert={onConvert}
            onCopyStrategus={onCopyStrategus}
            onLoadExample={loadExampleScript}
            buildingJson={buildingJson}
            debugging={debugging}
            generatedJson={generatedJson}
            errorLog={errorLog}
            buildError={buildError}
            debugAttempt={debugAttempt}
            onBuildJson={onBuildJson}
            onDebug={onDebug}
            onCopyGeneratedJson={onCopyGeneratedJson}
            onDownloadGeneratedJson={onDownloadGeneratedJson}
            errorLogExpanded={errorLogExpanded}
            onToggleErrorLog={() => setErrorLogExpanded((v) => !v)}
        />
    );
}

// apply observer only 'container'
const PreviewSectionCard = observer(PreviewSectionCardContainer);
export default PreviewSectionCard;
