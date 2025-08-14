import { NextRequest, NextResponse } from "next/server";
import { json2strategus } from "@/server/atlas/atlas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { analysisSpecifications } = await req.json();

    if (typeof analysisSpecifications !== "string") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    try {
        const script = await json2strategus(analysisSpecifications);
        return NextResponse.json({ script });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
    }
}
