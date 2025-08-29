import { NextRequest, NextResponse } from "next/server";
import { json2strategus } from "@/server/atlas/atlas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { analysisSpecifications } = await req.json();
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey || apiKey == "") {
        return NextResponse.json({ error: "API key missing" }, { status: 401 });
    }

    if (typeof analysisSpecifications !== "string") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const origin = req.nextUrl.origin;
    try {
        const script = await json2strategus(analysisSpecifications, { origin, apiKey });
        return NextResponse.json({ script });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
    }
}
