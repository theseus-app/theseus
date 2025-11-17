"use client";
import React from "react";
import NameSection from "@/components/NameSection";
import ComparisonSectionCard from "@/components/section/ComparisonSectionCard";
import AnalysisSectionCard from "@/components/section/AnalysisSectionCard";
import { observer } from "mobx-react-lite";
import FloatButton from "@/components/FloatButton";
import { StrategusModal, TextuiModal } from "@/components/modal";
import ApiInput from "@/components/ApiInput";

function StudyBuilderPage() {
  return (
    <div className="w-full flex flex-col max-w-[1280px] mx-auto mt-10">
      {/* Api Input */}
      <ApiInput />
      {/* <Header /> */}
      <main className="min-h-screen bg-gray-100 my-15">
        {/* name */}
        <NameSection />
        <div className="pt-6 pb-12 space-y-8 px-2">
          {/* Comparisons */}
          <ComparisonSectionCard />

          {/* Analysis Settings */}
          <AnalysisSectionCard />
        </div>


        {/* Modal */}
        <TextuiModal />
        <StrategusModal />

      </main>
      {/* Float Button */}
      <FloatButton />

    </div>
  );
}

export default observer(StudyBuilderPage)