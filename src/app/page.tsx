"use client";
import React from "react";
import NameSection from "@/components/NameSection";
import ComparisonSectionCard from "@/components/section/ComparisonSectionCard";
import AnalysisSectionCard from "@/components/section/AnalysisSectionCard";
import PreviewSectionCard from "@/components/section/PreviewSectionCard";
import { observer } from "mobx-react-lite";
import Text2JsonSectionCard from "@/components/section/Text2JsonSectionCard";
import FloatButton from "@/components/FloatButton";
import { useStore } from "@/stores/StoreProvider";
import { StrategusModal, TextuiModal } from "@/components/modal";

function StudyBuilderPage() {

  return (
    <div className="flex flex-col max-w-[1280px] mx-auto">
      {/* <Header /> */}
      <main className="min-h-screen bg-gray-100 my-15">
        {/* name */}
        <NameSection />


        <div className="pt-6 pb-12 space-y-8 px-4">
          {/* Comparisons */}
          <ComparisonSectionCard />

          {/* Analysis Settings */}
          <AnalysisSectionCard />
        </div>

        {/* Float Button */}
        <FloatButton />

        {/* Modal */}
        <TextuiModal />
        <StrategusModal />

      </main>
    </div>
  );
}

export default observer(StudyBuilderPage)