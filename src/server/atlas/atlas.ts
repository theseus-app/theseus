import OpenAI from "openai";

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
async function readPublicText(relPath: string, opts?: { origin?: string; cache?: RequestCache }) {
    const origin = resolveOrigin(opts?.origin);
    const url = new URL(relPath, origin).toString();
    const res = await fetch(url, { cache: opts?.cache ?? "force-cache" });
    if (!res.ok) throw new Error(`Failed to fetch ${relPath}: ${res.status} ${res.statusText}`);
    return res.text();
}

/**
 * User text input -> ATLAS JSON & description
 */
export async function text2json(
    text: string,
    currentAnalysisSpecifications: string,
    opts?: { origin?: string; cache?: RequestCache; apiKey?: string } // <-- 서버 라우트에서 origin 전달 권장
): Promise<{ updatedSpec: string; description: string }> {

    const client = new OpenAI({ apiKey: opts?.apiKey })

    // public/templates/customAtlasTemplate_v1.3.0_annotated.txt
    const analysisSpecificationsTemplate = await readPublicText(
        "/templates/customAtlasTemplate_v1.3.0_annotated.txt",
        opts
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
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";

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
    analysisSpecifications: string,
    opts?: { origin?: string; cache?: RequestCache; apiKey: string }
): Promise<string> {
    const client = new OpenAI({ apiKey: opts?.apiKey })

    // public/templates/CreateStrategusAnalysisSpecification_template.R
    const template = await readPublicText(
        "/templates/CreateStrategusAnalysisSpecification_template.R",
        opts
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
