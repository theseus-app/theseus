"use client";
import { observer } from "mobx-react-lite";
import MagicWandIcon from "@/assets/icon/MagicWand.svg";
import SparkleIcon from "@/assets/icon/Sparkle.svg";
import { useStore } from "@/stores/StoreProvider";

function FloatButton() {
    const { study } = useStore();
    const { strategusModalOpen, textuiModalOpen, setStrategusModalOpen, setTextuiModalOpen } = study;

    // hide button if modal open
    if (strategusModalOpen || textuiModalOpen) return null;

    const baseBtn =
        "rounded-full flex items-center gap-2 px-4 py-2 text-white border-2 border-white " +
        "shadow-xl hover:shadow-2xl active:shadow-md transition-all duration-200 " +
        "transform-gpu hover:-translate-y-0.5 focus-visible:outline-none " +
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

    return (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[1000] flex gap-4">
            <button
                type="button"
                onClick={() => setTextuiModalOpen(true)}
                className={`bg-primary ${baseBtn}`}
            >
                <SparkleIcon width={24} height={24} />
                <span className="font-medium">Text to UI Settings</span>
            </button>

            <button
                type="button"
                onClick={() => setStrategusModalOpen(true)}
                className={`bg-primary ${baseBtn}`}
            >
                <MagicWandIcon width={24} height={24} />
                <span className="font-medium">Generate Strategus R code</span>
            </button>
        </div>
    );
}

export default observer(FloatButton);
