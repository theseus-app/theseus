// src/stores/studyStore.ts
import { makeAutoObservable } from "mobx";
import type { StudyDTO } from "@/type/dtoBuilderType";
import { defaultDTO } from "@/utils/dtoBuilderHelper";

export class StudyStore {
    dto: StudyDTO = structuredClone(defaultDTO);
    open = false;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    // dto의 특정 key를 업데이트
    set<K extends keyof StudyDTO>(key: K, value: StudyDTO[K]) {
        this.dto = { ...this.dto, [key]: value };
    }

    setDto(v: StudyDTO) {
        this.dto = v;
    }

    setOpen(v: boolean) {
        this.open = v;
    }

    reset() {
        this.dto = structuredClone(defaultDTO);
        this.open = false;
    }

    /** jsonPretty 문자열을 직접 주입(임시/대비용) */
    setJsonPretty(json: string) {
        try {
            const parsed = JSON.parse(json) as StudyDTO;
            this.dto = parsed;
        } catch {
            throw new Error("setJsonPretty: invalid JSON");
        }
    }

    /**
     * LLM에서 받은 Updated Analysis Spec(JSON string)을 UI 상태에 적용.
     * - JSON.parse
     * - defaultDTO에 없는 필드는 제거
     * - defaultDTO 위에 딥머지(객체 merge, 배열 replace, 원시 덮어쓰기)
     * - 최종 dto 교체
     */
    applyAnalysisSpec(updatedSpec: string) {
        if (!updatedSpec?.trim()) throw new Error("applyAnalysisSpec: empty spec");

        let parsed: unknown;
        try {
            parsed = JSON.parse(updatedSpec);
        } catch {
            throw new Error("applyAnalysisSpec: invalid JSON");
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("applyAnalysisSpec: spec must be a JSON object");
        }

        // 1) 허용된 키만 남기기
        const cleaned = this.pruneUnknownKeys(parsed as Record<string, any>, defaultDTO);

        // 2) defaultDTO 위에 병합(배열은 치환, 객체는 재귀 병합)
        const merged = this.deepMerge(structuredClone(defaultDTO), cleaned) as StudyDTO;

        // 3) 전체 교체
        this.dto = merged;
    }

    /** defaultShape에 없는 키는 제거 (재귀) */
    private pruneUnknownKeys<T>(input: unknown, defaultShape: T): T {
        // default가 배열: 입력이 배열이면 그대로, 아니면 기본값 반환
        if (Array.isArray(defaultShape)) {
            return (Array.isArray(input) ? (input as unknown as T) : defaultShape) as T;
        }

        // default가 객체: 허용된 키만 재귀 보존
        if (defaultShape !== null && typeof defaultShape === "object") {
            const out: any = {};
            const src = (input ?? {}) as Record<string, unknown>;

            for (const key of Object.keys(defaultShape as Record<string, unknown>)) {
                const baseVal = (defaultShape as any)[key];
                const has = Object.prototype.hasOwnProperty.call(src, key);
                const nextVal = has ? (src as any)[key] : undefined;

                if (Array.isArray(baseVal)) {
                    out[key] = Array.isArray(nextVal) ? nextVal : baseVal;
                } else if (baseVal !== null && typeof baseVal === "object") {
                    out[key] = this.pruneUnknownKeys(nextVal, baseVal);
                } else {
                    // 원시: 키가 있으면 치환, 없으면 기본값 유지
                    out[key] = has ? nextVal : baseVal;
                }
            }
            return out as T;
        }

        // default가 원시: 입력이 undefined면 기본값, 아니면 입력값
        return ((input === undefined ? defaultShape : input) as unknown) as T;
    }

    private deepMerge<T>(base: T, patch: unknown): T {
        const p = patch as any;

        // 배열: 치환
        if (Array.isArray(base)) {
            return (Array.isArray(p) ? (p as unknown as T) : base) as T;
        }

        // 객체: 재귀 병합
        if (base !== null && typeof base === "object") {
            const out: any = { ...(base as any) };
            if (p && typeof p === "object") {
                for (const key of Object.keys(p)) {
                    const bv = (base as any)[key];
                    const pv = p[key];
                    if (Array.isArray(bv)) {
                        out[key] = Array.isArray(pv) ? pv : bv;
                    } else if (bv !== null && typeof bv === "object") {
                        out[key] = this.deepMerge(bv, pv);
                    } else {
                        out[key] = pv;
                    }
                }
            }
            return out as T;
        }

        // 원시: 덮어쓰기
        return (p as unknown) as T;
    }

    // computed
    get jsonPretty() {
        return JSON.stringify(this.dto, null, 2);
    }
}
