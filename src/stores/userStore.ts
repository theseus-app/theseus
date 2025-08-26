import { makeAutoObservable } from "mobx";

export class UserStore {
    apiKey: string | null = null;
    constructor() {
        makeAutoObservable(this, {}, { autoBind: true })
    }

    setApiKey(v: string) {
        this.apiKey = v
    }
}