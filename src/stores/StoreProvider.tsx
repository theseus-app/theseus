"use client";
import React, { createContext, useContext, useRef } from "react";
import { StudyStore } from "./studyStore";
import { UserStore } from "./userStore";

type RootStore = {
    study: StudyStore;
    user: UserStore;
};

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    // initValue: null, assign once in first render
    const storeRef = useRef<RootStore | null>(null);

    if (!storeRef.current) {
        storeRef.current = {
            study: new StudyStore(),
            user: new UserStore()
        };
    }

    return (
        <StoreContext.Provider value={storeRef.current}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("StoreProvider is missing.");
    return ctx;
}
