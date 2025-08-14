"use client";
import React from "react";
import { ArrayHeader, Field, NumInput, RowCard, SectionCard, TextInput } from "@/components/primitive";
import { useStore } from "@/stores/StoreProvider";
import CohortSettingSectionCard from "./comparisonSectionCard/CohortSettingSectionCard";
import NegativeControlSectionCard from "./comparisonSectionCard/NegatvieControlSectionCard";
import { observer } from "mobx-react-lite";
import CovariateSectionCard from "./comparisonSectionCard/CovariateSectionCard";

function ComparisonSectionCard() {
    const { study } = useStore()
    const { dto, set } = study;

    return (
        <SectionCard title="Comparisons" topGroup>
            {/* Cohort Setting */}
            <CohortSettingSectionCard />

            {/* Negative Control Concept Set */}
            <NegativeControlSectionCard />
            
            {/* Covariate Selection */}
            <CovariateSectionCard />

        </SectionCard>
    )
}

export default observer(ComparisonSectionCard)