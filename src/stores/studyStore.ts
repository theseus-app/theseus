// src/stores/studyStore.ts
import { makeAutoObservable } from "mobx";
import { StudyDTO } from "@/type/dtoBuilderType";
import { defaultDTO } from "@/utils/dtoBuilderHelper";

export class StudyStore {
    dto: StudyDTO = structuredClone(defaultDTO);
    open = false;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true }); // this 바인딩 자동
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

    // computed
    get jsonPretty() {
        return JSON.stringify(this.dto, null, 2);
    }
}
