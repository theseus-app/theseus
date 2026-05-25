import OpenAI from "openai";
import { readFile } from "fs/promises";
import { join } from "path";
import { getProvider, studyDtoSchema } from "theseus-core";


/** Remove code fences (```lang ... ```) from LLM outputs. */
export function stripCodeFences(text: string): string {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```[\w-]*\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
    return cleaned.trim();
}

/** Resolve absolute origin for server-side fetch to /public files */
function resolveOrigin(explicit?: string) {
    if (explicit) return explicit;
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL; // e.g. https://your.domain
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;       // e.g. https://xxx.vercel.app
    return "http://localhost:3000";                                               // dev fallback
}

/** Fetch text file from /public (e.g., "/templates/foo.txt") */
async function readPublicText(relPath: string) {
    // relPath: "/templates/customAtlasTemplate_v1.4.0_annotated.txt" 같은 형태 가정
    const normalized = relPath.replace(/^\/+/, ""); // 앞의 / 제거
    const filePath = join(process.cwd(), "public", normalized);
    // => <project-root>/public/templates/...

    return readFile(filePath, "utf8");
}

/**
 * User free text -> validated StudyDTO (stringified for the existing client contract).
 */
export async function text2json(
    text: string,
    _currentAnalysisSpecifications: string,
    _opts?: { origin?: string; cache?: RequestCache; apiKey?: string },
): Promise<{ updatedSpec: string }> {
    const analysisSpecificationsTemplate = await readPublicText(
        "/templates/customAtlasTemplate_v1.4.0_annotated.txt",
    );

    const prompt = `<Instruction>
From the provided <Text>, extract the key information to configure a population-level estimation study using the OMOP-CDM.
Leave any settings at their default values if they are not specified in the <Text>.
Refer to the fields and value types provided in the <Analysis Specifications Template> and do not add any additional fields.
</Instruction>

<Text>
${text}
</Text>

<Analysis Specifications Template>
${analysisSpecificationsTemplate}
</Analysis Specifications Template>`;

    const spec = await getProvider("OPENAI", "LIGHT").generateStructured(studyDtoSchema, { prompt });
    return { updatedSpec: JSON.stringify(spec, null, 2) };
}

/**
 * ATLAS JSON -> Strategus R script
 */
export async function json2strategus(
    analysisSpecifications: string,
    opts?: { origin?: string; cache?: RequestCache; apiKey?: string }
): Promise<string> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // public/templates/CreateStrategusAnalysisSpecification_template_v1.4.R
    const template = await readPublicText(
        "/templates/CreateStrategusAnalysisSpecification_template_v1.4.R"
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
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    return stripCodeFences(content);
}

/**
 * Debug a failed Strategus R script using LLM.
 * Takes the original script and error log, returns a fixed script.
 */
export async function debugStrategusScript(
    originalScript: string,
    errorLog: string,
): Promise<string> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const template = await readPublicText(
        "/templates/CreateStrategusAnalysisSpecification_template_v1.4.R"
    );

    const prompt = `<Instruction>
The following R script failed to execute. Analyze the error log and fix the script.
Refer to <Template> for the correct structure and syntax.
Output only the corrected R script without any additional text.
</Instruction>

<Template>
${template}
</Template>

<Original Script>
${originalScript}
</Original Script>

<Error Log>
${errorLog}
</Error Log>`;

    const completion = await client.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    return stripCodeFences(content);
}
