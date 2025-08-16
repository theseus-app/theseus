import { NextRequest, NextResponse } from "next/server";
import { text2json } from "@/server/atlas/atlas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { text, currentAnalysisSpecifications } = await req.json();

    if (typeof text !== "string" || typeof currentAnalysisSpecifications !== "string") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // public 파일을 절대 URL로 읽기 위해 origin 전달
    const origin = req.nextUrl.origin;


    try {
        const result = await text2json(text, currentAnalysisSpecifications, { origin });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
    }
}
