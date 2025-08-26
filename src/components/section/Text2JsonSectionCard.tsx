"use client";
import React, { useState } from "react";
import { Field } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";
import JsonMergeSectionCard from "@/components/section/JsonMergeSectionCard";

function Text2JsonSectionCardInner() {
    const { study, user } = useStore();
    const apiKey = user.apiKey

    // 입력/상태
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 변환 결과
    const [updatedSpec, setUpdatedSpec] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const currentSpec =
        typeof study?.jsonPretty === "string" ? study.jsonPretty : "";

    const onConvert = async () => {
        if (!text.trim()) {
            alert("변환할 텍스트를 입력해주세요");
            return;
        }
        setLoading(true);
        setError(null);
        setUpdatedSpec("");
        setDescription("");

        try {
            const res = await fetch("/api/atlas/text2json", {
                method: "POST",
                headers: { "content-type": "application/json", "x-api-key": apiKey ?? "" },
                body: JSON.stringify({
                    text,
                    currentAnalysisSpecifications: currentSpec,
                }),
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`API ${res.status}: ${t}`);
            }

            const { updatedSpec, description } = (await res.json()) as {
                updatedSpec: string;
                description: string;
            };

            setUpdatedSpec(updatedSpec);
            setDescription(description);
        } catch (e: any) {
            setError(e?.message ?? "Failed to convert text to JSON spec");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Field title="Generate Study Settings from Free Text" label="Paste free text from a paper or your study design. We’ll compare it with the previous version so you can select changes to apply to the UI.">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-40 rounded-xl border p-3 text-sm"
            />
            <div className="flex">
                <button
                    className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                    onClick={onConvert}
                    disabled={loading || !text.trim()}
                >
                    {loading ? "Converting..." : "Convert text → JSON"}
                </button>
            </div>
            {description && (
                <Field title="How this spec was derived (LLM description)">
                    <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                        {description}
                    </pre>
                </Field>
            )}

            {updatedSpec && (
                <>
                    {/* 여기서 병합 카드 연결 */}
                    <JsonMergeSectionCard
                        nextJson={updatedSpec}
                        title="Review & Merge with Current UI"
                        onApplied={() => {
                            // 병합 적용 후 후처리(선택): 새 JSON 반영 결과 확인 토스트/리프레시 등
                            // 예: alert("병합이 적용되었습니다!");
                        }}
                    />
                </>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Field>


    );
}

export default observer(Text2JsonSectionCardInner);
