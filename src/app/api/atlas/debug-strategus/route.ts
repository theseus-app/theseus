import { NextRequest, NextResponse } from "next/server";
import { debugStrategusScript } from "@/server/atlas/atlas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { originalScript, errorLog } = await req.json();

    if (typeof originalScript !== "string" || typeof errorLog !== "string") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    try {
        const script = await debugStrategusScript(originalScript, errorLog);
        return NextResponse.json({ script });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message ?? "Server error" },
            { status: 500 }
        );
    }
}
