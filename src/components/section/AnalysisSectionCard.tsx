"use client";
import React from "react";
import StudyPopulationSectionCard from "./analysisSetting/StudyPopulationSectionCard";
import TimeAtRiskSectionCard from "./analysisSetting/TimeAtRiskSectionCard";
import PropensitySectionCard from "./analysisSetting/PropensitySectionCard";
import OutcomeSection from "./analysisSetting/OutcomeSection";
import { SectionCard } from "../primitive";

export default function AnalysisSectionCard() {

    return (
        <SectionCard title="Analysis Settings" topGroup>

            {/* Study Population */}
            <StudyPopulationSectionCard />

            {/* Time At Risk */}
            <TimeAtRiskSectionCard />

            {/* Propensity Score Adjustment */}
            <PropensitySectionCard />

            {/* fitOutcomeModelArgs */}
            <OutcomeSection />

        </SectionCard >
    )
}