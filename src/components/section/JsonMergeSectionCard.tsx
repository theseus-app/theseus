"use client";
import React, { useMemo, useState } from "react";
import { SectionCard, Field } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";
import { getTitleForPath } from "@/utils/pathTitles";

/** ---------- helpers: parse / pretty ---------- */
/** 코드펜스 제거 (```json ... ```), 앞뒤 공백 트림 */
function stripCodeFences(text: string): string {
    return text
        .replace(/^\s*```[\w-]*\s*/i, "")
        .replace(/\s*```+\s*$/i, "")
        .trim();
}

/** 텍스트에서 첫 번째 JSON(객체/배열) 블록만 추출 */
function extractFirstJson(text: string): string | null {
    const s = stripCodeFences(text);

    // 1) 첫 여는 괄호 위치 찾기
    let start = -1;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === "{" || ch === "[") {
            start = i;
            break;
        }
    }
    if (start === -1) return null;

    // 2) 문자열/이스케이프를 고려한 괄호 매칭
    let depth = 0;
    let inStr = false;
    let esc = false;
    const open = s[start];

    for (let i = start; i < s.length; i++) {
        const ch = s[i];

        if (inStr) {
            if (esc) {
                esc = false;
            } else if (ch === "\\") {
                esc = true;
            } else if (ch === '"') {
                inStr = false;
            }
            continue;
        }

        if (ch === '"') {
            inStr = true;
        } else if (ch === "{" || ch === "[") {
            depth++;
        } else if (ch === "}" || ch === "]") {
            depth--;
            if (depth === 0) {
                // 열었던 종류와 닫힘 종류가 맞는지(느슨히 체크)
                const isObjectJson = open === "{" && ch === "}";
                const isArrayJson = open === "[" && ch === "]";
                if (isObjectJson || isArrayJson) {
                    return s.slice(start, i + 1);
                }
            }
        }
    }
    return null;
}

/** 느슨한 파서: 텍스트에서 JSON만 뽑아 안전 파싱 */
function safeParseJsonFromText(text: string): any {
    if (!text) return null;

    // 1차: 괄호 매칭으로 추출
    const candidate = extractFirstJson(text);
    if (candidate) {
        try {
            return JSON.parse(candidate);
        } catch {
            // 계속 진행
        }
    }

    // 2차: 첫 '{'부터 잘라서 시도 (백업)
    const braceIdx = text.indexOf("{");
    if (braceIdx !== -1) {
        try {
            return JSON.parse(text.slice(braceIdx));
        } catch {
            // noop
        }
    }

    // 3차: 첫 '['부터 잘라서 시도 (배열 루트인 경우)
    const bracketIdx = text.indexOf("[");
    if (bracketIdx !== -1) {
        try {
            return JSON.parse(text.slice(bracketIdx));
        } catch {
            // noop
        }
    }

    return null;
}
function safeParse(jsonStr: string): any {
    try {
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}
function pretty(v: any) {
    return typeof v === "string" ? v : JSON.stringify(v, null, 2);
}
function isObject(v: any) {
    return v !== null && typeof v === "object";
}

/** ---------- helpers: flatten / unflatten ---------- */
/** leaf 기준으로 dot-path 플랫. 배열 인덱스는 점으로 연결 (a.0.b) */
function flatten(obj: any, prefix = ""): Record<string, any> {
    const out: Record<string, any> = {};
    const walk = (val: any, path: string) => {
        if (isObject(val)) {
            if (Array.isArray(val)) {
                if (val.length === 0) {
                    out[path] = []; // 빈 배열도 leaf로 간주
                    return;
                }
                val.forEach((v, i) => {
                    walk(v, path ? `${path}.${i}` : String(i));
                });
            } else {
                const keys = Object.keys(val);
                if (keys.length === 0) {
                    out[path] = {}; // 빈 객체도 leaf로 간주
                    return;
                }
                keys.forEach((k) => walk(val[k], path ? `${path}.${k}` : k));
            }
        } else {
            // primitive or null
            out[path] = val;
        }
    };
    if (obj === undefined) return out;
    if (!prefix) {
        if (isObject(obj) && Object.keys(obj).length === 0) return { "": obj };
        Object.keys(obj).forEach((k) => walk(obj[k], k));
    } else {
        walk(obj, prefix);
    }
    return out;
}

/** 경로에 값을 세팅. a.0.b 형태 지원 */
function setByPath(target: any, path: string, value: any) {
    if (!path) return;
    const segs = path.split(".");
    let cur = target;
    for (let i = 0; i < segs.length - 1; i++) {
        const key = segs[i];
        const idx = Number.isInteger(+key) ? +key : key;
        const nextSeg = segs[i + 1];
        const nextIsIndex = Number.isInteger(+nextSeg);

        if (typeof idx === "number") {
            if (!Array.isArray(cur)) {
                // 중간에 배열이 아닌데 인덱스가 오면 배열 생성
                // (상태를 망가뜨리지 않도록 최소 생성)
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                cur = (cur[segs[i - 1]] = []);
            }
            if (cur[idx] === undefined) cur[idx] = nextIsIndex ? [] : {};
            cur = cur[idx];
        } else {
            if (!isObject(cur[idx])) cur[idx] = nextIsIndex ? [] : {};
            cur = cur[idx];
        }
    }
    const last = segs[segs.length - 1];
    const lastIdx = Number.isInteger(+last) ? +last : last;
    if (typeof lastIdx === "number") {
        if (!Array.isArray(cur)) return; // 방어
        cur[lastIdx] = value;
    } else {
        cur[lastIdx] = value;
    }
}

/** 깊은 동등 비교(간단 버전) */
function deepEqual(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/** ---------- Component ---------- */
type JsonMergeSectionCardProps = {
    /** 변환으로 얻은 새 JSON 문자열 */
    nextJson: string;
    /** 타이틀 커스터마이즈 옵션 */
    title?: string;
    /** “Apply Merge” 후 콜백(성공 시) */
    onApplied?: () => void;
};

function JsonMergeSectionCardInner({ nextJson, title = "Merge JSON", onApplied }: JsonMergeSectionCardProps) {
    const { study } = useStore();
    const prevJsonStr = study.jsonPretty;

    const prevObj = useMemo(() => safeParse(prevJsonStr), [prevJsonStr]);
    const nextObj = useMemo(() => safeParseJsonFromText(nextJson), [nextJson]);

    const [showOnlyDiff, setShowOnlyDiff] = useState(true);

    /** path -> { old, next } 를 구성 */
    const rows = useMemo(() => {
        const fPrev = flatten(prevObj ?? {});
        const fNext = flatten(nextObj ?? {});
        const keys = Array.from(new Set([...Object.keys(fPrev), ...Object.keys(fNext)])).sort();

        const items = keys.map((k) => {
            return {
                path: k,
                oldVal: fPrev[k],
                newVal: fNext[k],
                isDiff: !deepEqual(fPrev[k], fNext[k]),
            };
        });
        return items;
    }, [prevObj, nextObj]);

    /** 각 row 선택 상태: default = diff는 New, 동일은 Old */
    const [choice, setChoice] = useState<Record<string, "old" | "new">>({});

    // 초기화/동기화: nextObj가 바뀌면 choice 디폴트 설정
    React.useEffect(() => {
        const init: Record<string, "old" | "new"> = {};
        for (const r of rows) {
            init[r.path] = r.isDiff ? "new" : "old";
        }
        setChoice(init);
    }, [rows]);

    const visibleRows = showOnlyDiff ? rows.filter((r) => r.isDiff) : rows;

    const allTo = (to: "old" | "new") => {
        const next: Record<string, "old" | "new"> = {};
        for (const r of rows) next[r.path] = to;
        setChoice(next);
    };

    const applyMerge = () => {
        if (!prevObj || typeof prevObj !== "object") {
            alert("현재 JSON이 올바르지 않습니다.");
            return;
        }
        const base = JSON.parse(JSON.stringify(prevObj)); // deep clone
        for (const r of rows) {
            const sel = choice[r.path];
            if (sel === "new") {
                setByPath(base, r.path, r.newVal);
            } else {
                // 'old' 선택: 아무 것도 안 함(기존 값 유지)
            }
        }
        try {
            study.setDto(base); // StudyDTO 구조라고 가정 (형이 다르면 store setDto 로직 조정)
            onApplied?.();
            alert("병합 적용 완료!");
        } catch (e: any) {
            alert("병합 적용 실패: " + (e?.message ?? "unknown"));
        }
    };

    return (
        <SectionCard title={title} topGroup>


            <Field title="Field-level Merge">
                <div className="mb-3 flex gap-2 items-center">
                    <button
                        className="px-3 py-1.5 rounded-[4px] border-[2px] border-gray-400 text-black cursor-pointer"
                        onClick={() => allTo("old")}
                        title="모든 필드를 이전값으로 선택"
                    >
                        Select All: Old
                    </button>
                    <button
                        className="px-3 py-1.5 rounded-[4px] border-[2px] border-gray-400 text-black cursor-pointer"
                        onClick={() => allTo("new")}
                        title="모든 필드를 새값으로 선택"
                    >
                        Select All: New
                    </button>

                    <label className="ml-auto inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={showOnlyDiff}
                            onChange={(e) => setShowOnlyDiff(e.target.checked)}
                        />
                        Show only differences
                    </label>
                </div>

                {/* 테이블: path/old/new/choice */}
                <div className="border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 bg-gray-50 border-b px-3 py-2 text-xs font-semibold">
                        <div className="col-span-4">Path</div>
                        <div className="col-span-3">Old</div>
                        <div className="col-span-3">New</div>
                        <div className="col-span-2 text-center">Choice</div>
                    </div>

                    <div className="max-h-80 overflow-auto">
                        {visibleRows.length === 0 ? (
                            <div className="p-4 text-sm text-gray-600">표시할 항목이 없습니다.</div>
                        ) : (
                            visibleRows.map((r) => {
                                const selected = choice[r.path] ?? (r.isDiff ? "new" : "old");
                                return (
                                    <div key={r.path} className="grid grid-cols-12 border-b px-3 py-2 text-[12px]">
                                        <div className="col-span-4 pr-2 break-all font-medium">{getTitleForPath(r.path) || "<root>"}</div>
                                        <div className="col-span-3 pr-2">
                                            <pre className="whitespace-pre-wrap">{pretty(r.oldVal)}</pre>
                                        </div>
                                        <div className="col-span-3 pr-2">
                                            <pre className="whitespace-pre-wrap">{pretty(r.newVal)}</pre>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-center gap-3">
                                            <label className="inline-flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`choice-${r.path}`}
                                                    checked={selected === "old"}
                                                    onChange={() => setChoice((c) => ({ ...c, [r.path]: "old" }))}
                                                />
                                                Old
                                            </label>
                                            <label className="inline-flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`choice-${r.path}`}
                                                    checked={selected === "new"}
                                                    onChange={() => setChoice((c) => ({ ...c, [r.path]: "new" }))}
                                                />
                                                New
                                            </label>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="mt-3 flex justify-end">
                    <button
                        className="px-4 py-2 rounded-[4px] bg-primary text-white cursor-pointer"
                        onClick={applyMerge}
                    >
                        Apply Merge
                    </button>
                </div>
            </Field>
        </SectionCard>
    );
}

export default observer(JsonMergeSectionCardInner);
