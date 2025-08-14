import { openai as client } from "@/lib/openai";
import { readFile } from "node:fs/promises";

/** Remove code fences (```lang ... ```) from LLM outputs. */
export function stripCodeFences(text: string): string {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```[\w]*\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
    return cleaned.trim();
}

/** 안전한 파일 로딩: 코드 파일 기준 상대경로(new URL) */
async function readTextResource(relativePathFromThisFile: string) {
    const url = new URL(relativePathFromThisFile, import.meta.url);
    return readFile(url, "utf-8");
}

/**
 * User text input -> ATLAS JSON & description
 */
export async function text2json(
    text: string,
    currentAnalysisSpecifications: string
): Promise<{ updatedSpec: string; description: string }> {
    const analysisSpecificationsTemplate = await readTextResource(
        "./resources/customAtlasTemplate_v1.3.0_annotated.txt"
    );

    const prompt = `<Instruction>
From the provided <Text>, extract the key information and update the <Current Analysis Specifications> JSON to configure a population-level estimation study using the OMOP-CDM.
Leave any settings at their default values if they are not specified in the <Text>.
Refer to the fields and value types provided in the <Analysis Specifications Template> and do not add any additional fields.
Following the <Output Style> format, output the updated analysis specifications JSON and provide a description of how the new settings are applied to the specification. 
</Instruction>

<Text>
${text}
</Text>

<Current Analysis Specifications>
${currentAnalysisSpecifications}
</Current Analysis Specifications>

<Analysis Specifications Template>
${analysisSpecificationsTemplate}
</Analysis Specifications Template>

<Output Style>
\`\`\`json
analysis specifications 
\`\`\`
---
Description
</Output Style>`;

    const completion = await client.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";

    // Split on first '---'
    let updatedSpecRaw = content;
    let description = "";
    const splitMatch = content.match(/([\s\S]*?)\n?---\n?([\s\S]*)/);
    if (splitMatch) {
        updatedSpecRaw = splitMatch[1];
        description = splitMatch[2]?.trim() ?? "";
    }

    const updatedSpec = stripCodeFences(updatedSpecRaw);
    return { updatedSpec, description };
}

/**
 * ATLAS JSON -> Strategus R script
 */
export async function json2strategus(
    analysisSpecifications: string
): Promise<string> {
    const template = await readTextResource(
        "./resources/CreateStrategusAnalysisSpecification_template.R"
    );

    const prompt = `<Instruction>
Refer to settings in <Analysis Specifications> and use the OHDSI Strategus package to write CreateStrategusAnalysisSpecification.R script. 
Refer to <Template> to write the script.
Output only the R script without any additional text.
Include detailed annotations within the script to help users understand how the settings are applied.
</Instruction>

<Analysis Specifications>
${analysisSpecifications}
</Analysis Specifications>

<Template>
${template}
</Template>`;

    const completion = await client.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    return stripCodeFences(content);
}
