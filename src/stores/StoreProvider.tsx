"use client";

import React, { createContext, useContext, useRef } from "react";
import { StudyStore } from "./studyStore";

type RootStore = {
    study: StudyStore;
};

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    // 초기값을 null로 주고, 첫 렌더에 한 번만 할당
    const storeRef = useRef<RootStore | null>(null);

    if (!storeRef.current) {
        storeRef.current = {
            study: new StudyStore(),
        };
    }

    return (
        <StoreContext.Provider value={storeRef.current}>
            {children}
        </StoreContext.Provider>
    );
}

// 컴포넌트에서 쓰는 훅
export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("StoreProvider가 감싸고 있지 않아요.");
    return ctx;
}
