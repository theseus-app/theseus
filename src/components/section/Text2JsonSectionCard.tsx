"use client";
import React, { useState } from "react";
import { Field } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";
import JsonMergeSectionCard from "@/components/section/JsonMergeSectionCard";
import { sleep } from "@/utils/sleep";

function Text2JsonSectionCardInner() {
    const { study, user } = useStore();
    // const apiKey = user.apiKey

    // 입력/상태
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // 예제 원본 텍스트 (수정 여부 판단용)
    const [isExampleLoaded, setIsExampleLoaded] = useState(false);

    // 변환 결과
    const [updatedSpec, setUpdatedSpec] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const currentSpec =
        typeof study?.jsonPretty === "string" ? study.jsonPretty : "";

    const loadExample = async () => {
        try {
            const res = await fetch(
                "/examples/TICAGRELOR_CLOPIDOGREL_TEXT.txt"
            );

            if (!res.ok) throw new Error("Failed to load example");

            const exampleText = await res.text();
            setText(exampleText);
            setIsExampleLoaded(true)
        } catch (e: any) {
            setError(e.message ?? "Failed to load example");
        }
    };

    const onConvert = async () => {
        if (!text.trim()) {
            alert("Please enter the text");
            return;
        }
        setLoading(true);
        setError(null);
        setUpdatedSpec("");
        setDescription("");

        try {
            // text가 example 그대로인 상태면, 미리 준비해둔 JSON 예시 불러오기
            if (isExampleLoaded) {
                const res = await fetch(
                    "/examples/TICAGRELOR_CLOPIDOGREL_JSON.json"
                );

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(`Example JSON ${res.status}: ${t}`);
                }

                // JSON 파일 구조에 따라 다르게 처리 가능
                // 여기서는 "전체 JSON을 예쁘게 stringify 해서 updatedSpec에 넣는다" 가정
                const jsonData = await res.json();
                const pretty = JSON.stringify(jsonData, null, 2);
                await sleep(3000);
                setUpdatedSpec(pretty);
                return;
            }

            const res = await fetch("/api/atlas/text2json", {
                method: "POST",
                headers: { "content-type": "application/json", "x-api-key": process.env.OPENAI_API_KEY ?? "" },
                body: JSON.stringify({
                    text,
                    currentAnalysisSpecifications: currentSpec,
                }),
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`API ${res.status}: ${t}`);
            }

            const { updatedSpec } = (await res.json()) as { updatedSpec: string };

            setUpdatedSpec(updatedSpec);
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
                onChange={(e) => {
                    setText(e.target.value)
                    setIsExampleLoaded(false)
                }}
                className="w-full h-40 rounded-xl border p-3 text-sm"
            />
            <div className="flex gap-2">
                <button
                    onClick={loadExample}
                    className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                    Load Example
                </button>
                <button
                    className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer disabled:opacity-60"
                    onClick={onConvert}
                    disabled={loading || !text.trim()}
                >
                    {loading ? "Converting..." : "Convert text → JSON"}
                </button>
            </div>
            <Field title="Notes (optional)" label="Add your own notes about how this spec was derived.">
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 rounded-xl border p-3 text-sm"
                    placeholder="e.g. Derived from the Methods section; sensitivity analysis omitted."
                    aria-label="Notes about how this spec was derived"
                />
            </Field>

            {updatedSpec && (
                <>
                    <JsonMergeSectionCard
                        nextJson={updatedSpec}
                        title="Review & Merge with Current UI"
                        onApplied={() => {
                            //ex: alert()
                        }}
                    />
                </>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Field>


    );
}

export default observer(Text2JsonSectionCardInner);
