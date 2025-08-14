"use client";
import React from "react";
import NameSection from "@/components/NameSection";
import ComparisonSectionCard from "@/components/section/ComparisonSectionCard";
import AnalysisSectionCard from "@/components/section/AnalysisSectionCard";
import PreviewSectionCard from "@/components/section/PreviewSectionCard";
import { observer } from "mobx-react-lite";
import Text2JsonSectionCard from "@/components/section/Text2JsonSectionCard";

function StudyBuilderPage() {

  return (
    <div className="flex flex-col max-w-[1280px] mx-auto">
      {/* <Header /> */}
      <main className="min-h-screen bg-gray-100 my-15">
        {/* name */}
        <NameSection />


        <div className="pt-6 pb-12 space-y-8 px-4">

          {/* Text2Json */}
          <Text2JsonSectionCard />

          {/* Comparisons */}
          <ComparisonSectionCard />

          {/* Analysis Settings */}
          <AnalysisSectionCard />

          {/* Preview & Export */}
          <PreviewSectionCard />
        </div>

        {/* <Modal open={open} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <pre className="text-xs bg-black text-green-200 rounded-xl p-3 overflow-auto max-h-[50vh]">
              {jsonPretty}
            </pre>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 text-white"
                onClick={() => {
                  setOpen(false);
                  alert("확인되었습니다. (여기서 API 호출 로직을 연결하세요)");
                }}
              >
                Export
              </button>
            </div>
          </div>
        </Modal> */}
      </main>
    </div>
  );
}

export default observer(StudyBuilderPage)