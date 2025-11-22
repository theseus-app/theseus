"use client";
import React, { useState } from "react";
import { Field } from "@/components/primitive";
import copyToClipboard from "@/utils/copyToClipboard";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

}) {
    const {
        jsonPretty,
        strategusScript,
        loading,
        error,
        onCopyJson,
        onConvert,
        onCopyStrategus,
        onLoadExample
    } = props;

    return (
        <Field title="LLM-powered Strategus R code generated" label="Uses an LLM to convert the current UI into Strategus-ready R code for analysis.">
            <div className="flex gap-2 items-center">
                <button
                    className="px-4 py-2 rounded-[4px] bg-gray-200 text-black cursor-pointer disabled:opacity-60"
                    onClick={onLoadExample}
                    disabled={loading}
                >
                    Load Example
                </button>
                <button
                    className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                    onClick={onConvert}
                    disabled={loading || !jsonPretty}
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

    const { user } = useStore()
    // const apiKey = user.apiKey
    const jsonPretty = typeof study?.jsonPretty === "string" ? study.jsonPretty : "";

    const onCopyJson = async () => {
        await copyToClipboard(jsonPretty);
    };

    const onCopyStrategus = async () => {
        const ok = await copyToClipboard(strategusScript);

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
        } catch (e: any) {
            setError(e?.message ?? "Failed to convert to Strategus script");
        } finally {
            setLoading(false);
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
        />
    );
}

// apply observer only 'container'
const PreviewSectionCard = observer(PreviewSectionCardContainer);
export default PreviewSectionCard;
