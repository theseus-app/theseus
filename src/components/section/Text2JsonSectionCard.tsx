"use client";
import React, { useState } from "react";
import { SectionCard, Field } from "@/components/primitive";
import copyToClipboard from "@/utils/copyToClipboard";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";
import JsonMergeSectionCard from "@/components/section/JsonMergeSectionCard"; // ✅ 병합 카드 import

function Text2JsonSectionCardInner() {
    const { study } = useStore();

    // 입력/상태
    const [text, setText] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 변환 결과
    const [updatedSpec, setUpdatedSpec] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const currentSpec =
        typeof study?.jsonPretty === "string" ? study.jsonPretty : "";

    const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFileName(f.name);
        const txt = await f.text();
        setText(txt);
    };

    const onConvert = async () => {
        if (!text.trim()) {
            alert("변환할 텍스트를 입력하거나 파일을 선택해줘!");
            return;
        }
        setLoading(true);
        setError(null);
        setUpdatedSpec("");
        setDescription("");

        try {
            const res = await fetch("/api/atlas/text2json", {
                method: "POST",
                headers: { "content-type": "application/json" },
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

    const onCopyUpdated = async () => {
        await copyToClipboard(updatedSpec);
    };

    const onApply = () => {
        if (!updatedSpec) {
            alert("먼저 텍스트를 JSON으로 변환해줘!");
            return;
        }
        if (typeof (study as any)?.applyAnalysisSpec === "function") {
            (study as any).applyAnalysisSpec(updatedSpec);
            alert("UI에 적용 완료!");
        } else if ("setJsonPretty" in study && typeof (study as any).setJsonPretty === "function") {
            (study as any).setJsonPretty(updatedSpec);
            alert("jsonPretty만 갱신했어. 전체 UI 반영 로직은 study.applyAnalysisSpec에서 구현해줘!");
        } else {
            alert("study.applyAnalysisSpec(updatedSpec)를 구현해줘!");
        }
    };

    return (
        <SectionCard title="Text → ATLAS JSON" topGroup>
            <Field title="Source Text (paper snippet or your notes)">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="논문/노트 텍스트를 붙여넣기…"
                    className="w-full h-40 rounded-xl border p-3 text-sm"
                />
                <div className="mt-2 flex items-center gap-2">
                    {fileName && <span className="text-xs text-gray-600">Selected: {fileName}</span>}
                </div>
                <div className="flex">
                    <button
                        className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                        onClick={onConvert}
                        disabled={loading || !text.trim()}
                    >
                        {loading ? "Converting..." : "Convert text → JSON"}
                    </button>
                </div>

            </Field>

            {description && (
                <Field title="How this spec was derived (LLM description)">
                    <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                        {description}
                    </pre>
                </Field>
            )}

            {updatedSpec && (
                <>
                    <Field title="Updated Analysis Specifications (JSON)">
                        <div className="mb-2 flex items-center justify-end gap-2">
                            <button
                                className="px-3 py-1.5 rounded-[4px] border-[2px] border-gray-400 text-black cursor-pointer"
                                onClick={onCopyUpdated}
                            >
                                Copy Updated JSON
                            </button>
                            <button
                                className="px-3 py-1.5 rounded-[4px] bg-primary text-white cursor-pointer"
                                onClick={onApply}
                                title="전체 UI 상태를 이 JSON으로 교체"
                            >
                                Apply to UI (overwrite)
                            </button>
                        </div>
                        <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-64">
                            {updatedSpec}
                        </pre>
                    </Field>

                    {/* ✅ 여기서 병합 카드 연결 */}
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
        </SectionCard>
    );
}

export default observer(Text2JsonSectionCardInner);
