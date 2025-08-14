"use client";
import React, { useState } from "react";
import { Field, SectionCard } from "@/components/primitive";
import copyToClipboard from "@/utils/copyToClipboard";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";

/** 프레젠테이션 컴포넌트: 훅 없음 */
function PreviewSectionCardView(props: {
    jsonPretty: string;
    strategusScript: string;
    loading: boolean;
    error: string | null;
    onCopyJson: () => void;
    onConvert: () => void;
    onCopyStrategus: () => void;
}) {
    const {
        jsonPretty,
        strategusScript,
        loading,
        error,
        onCopyJson,
        onConvert,
        onCopyStrategus,
    } = props;

    return (
        <SectionCard title="Preview & Export" topGroup>
            <Field title="Your Selected JSON">
                <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-64">
                    {jsonPretty}
                </pre>

                <div className="flex gap-2 items-center">
                    <button
                        className="px-4 py-2 rounded-[4px] border-[2px] border-gray-400 text-black cursor-pointer"
                        onClick={onCopyJson}
                    >
                        Copy JSON
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
            </Field>

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
        </SectionCard>
    );
}

/** 컨테이너 컴포넌트: 훅은 여기서만, 순서/개수 고정 */
function PreviewSectionCardContainer() {
    const { study } = useStore(); // 1
    const [loading, setLoading] = useState(false); // 2
    const [error, setError] = useState<string | null>(null); // 3
    const [strategusScript, setStrategusScript] = useState<string>(""); // 4

    // store에서 읽는 값도 미리 안전하게 기본값 처리
    const jsonPretty = typeof study?.jsonPretty === "string" ? study.jsonPretty : "";

    const onCopyJson = async () => {
        await copyToClipboard(jsonPretty);
    };

    const onCopyStrategus = async () => {
        const ok = await copyToClipboard(strategusScript);

    };

    const onConvert = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/atlas/json2strategus", {
                method: "POST",
                headers: { "content-type": "application/json" },
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
        />
    );
}

// observer는 컨테이너에만 적용
const PreviewSectionCard = observer(PreviewSectionCardContainer);
export default PreviewSectionCard;
