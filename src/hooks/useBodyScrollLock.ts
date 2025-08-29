// src/hooks/useBodyScrollLock.ts
"use client";
import { useEffect } from "react";

let locks = 0;
let initialOverflow: string | null = null;
let initialPaddingRight: string | null = null;

export function useBodyScrollLock(active: boolean) {
    useEffect(() => {
        if (!active) return;

        const html = document.documentElement;
        const body = document.body;
        const scrollbarWidth = window.innerWidth - html.clientWidth;

        // save existed state
        if (locks === 0) {
            initialOverflow = body.style.overflow || "";
            initialPaddingRight = body.style.paddingRight || "";
            body.style.overflow = "hidden";
            if (scrollbarWidth > 0) {
                body.style.paddingRight = `${scrollbarWidth}px`;
            }
        }

        locks += 1;
        return () => {
            locks -= 1;
            if (locks === 0) {
                // reset
                body.style.overflow = initialOverflow ?? "";
                body.style.paddingRight = initialPaddingRight ?? "";
                initialOverflow = null;
                initialPaddingRight = null;
            }
        };
    }, [active]);
}
