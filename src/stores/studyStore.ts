// src/stores/studyStore.ts
import { makeAutoObservable } from "mobx";
import type { StudyDTO } from "@/types/dtoBuilderType";
import { defaultDTO } from "@/utils/dtoBuilderHelper";

export class StudyStore {
    dto: StudyDTO = structuredClone(defaultDTO);
    open = false;
    textuiModalOpen = false;
    strategusModalOpen = false;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    // update specific dto key
    set<K extends keyof StudyDTO>(key: K, value: StudyDTO[K]) {
        this.dto = { ...this.dto, [key]: value };
    }

    setDto(v: StudyDTO) {
        this.dto = v;
    }

    setOpen(v: boolean) {
        this.open = v;
    }

    setTextuiModalOpen(v: boolean) {
        this.textuiModalOpen = v;
    }

    setStrategusModalOpen(v: boolean) {
        this.strategusModalOpen = v;
    }

    reset() {
        this.dto = structuredClone(defaultDTO);
        this.open = false;
    }

    /** set jsonPretty string */
    setJsonPretty(json: string) {
        try {
            const parsed = JSON.parse(json) as StudyDTO;
            this.dto = parsed;
        } catch {
            throw new Error("setJsonPretty: invalid JSON");
        }
    }

    /**
        apply Updated Analysis Spec(JSON string) to UI State
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


        const cleaned = this.pruneUnknownKeys(parsed as Record<string, any>, defaultDTO);

        const merged = this.deepMerge(structuredClone(defaultDTO), cleaned) as StudyDTO;

        this.dto = merged;
    }

    /** remove keys that are not present in defaultShape */
    private pruneUnknownKeys<T>(input: unknown, defaultShape: T): T {
        if (Array.isArray(defaultShape)) {
            return (Array.isArray(input) ? (input as unknown as T) : defaultShape) as T;
        }

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
                    out[key] = has ? nextVal : baseVal;
                }
            }
            return out as T;
        }

        return ((input === undefined ? defaultShape : input) as unknown) as T;
    }

    private deepMerge<T>(base: T, patch: unknown): T {
        const p = patch as any;

        if (Array.isArray(base)) {
            return (Array.isArray(p) ? (p as unknown as T) : base) as T;
        }

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

        return (p as unknown) as T;
    }

    // computed
    get jsonPretty() {
        return JSON.stringify(this.dto, null, 2);
    }
}
