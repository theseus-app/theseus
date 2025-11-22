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
                setDescription(
                    "This specification incorporates the key details provided in the text as follows:\n\n- **Study Periods**: Both periods are now explicitly specified:\n  - Period 1: November 2011 to March 2019 (`20111101` to `20190331`).\n  - Period 2: March 2013 to December 2016 (`20130301` to `20161231`).\n- **Time-at-Risk Windows**:\n  - TAR 1: The primary window begins 1 day after index (to disregard day 0) and goes to end of observation, consistent with censoring at database exit with continued inclusion after treatment discontinuation/switch in the first year.\n  - TAR 2: 5-year risk window post-index (1 day after start, through 1826 days = 5 years).\n  - TAR 3: \"On-treatment\" period, starting 1 day after index through end of persistent treatment (specific logic for persistent exposure and 7-day gap would be implemented in cohort definition, but annotated here).\n- **Propensity Score Adjustment**:\n  - Three PS settings correspond to:\n    - PS 1: One-to-one greedy matching (`maxRatio=1`).\n    - PS 2: Variable-ratio matching with up to 10 (`maxRatio=10`).\n    - PS 3: Decile-based propensity score stratification (`numberOfStrata=10`, base \"all\").\n- **Outcome Model**: Kept as Cox regression per the text.\n- Unspecified settings remain at their default values.\nNo cohort or concept IDs or names, or covariate selections, are changed since these are not specified in the text."
                );
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
            {description && (
                <Field title="How this spec was derived (LLM description)">
                    <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                        {description}
                    </pre>
                </Field>
            )}

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
