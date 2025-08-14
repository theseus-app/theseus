"use client";
import React from "react";
import { SectionCard } from "@/components/primitive";
import copyToClipboard from "@/utils/copyToClipboard";
import { useStore } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";

function PreviewSectionCard() {
    const { study } = useStore()
    const { jsonPretty, setOpen } = study;

    return (
        < SectionCard title="Preview & Export" topGroup >
            <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-64">
                {jsonPretty}
            </pre>
            <div className="flex gap-2">
                <button className="px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-80 cursor-pointer" onClick={() => copyToClipboard(jsonPretty)}>
                    Copy JSON
                </button>
            </div>
        </SectionCard >
    )
}

export default observer(PreviewSectionCard)