import { NextRequest, NextResponse } from "next/server";
import { execRscript } from "@/server/atlas/executeR";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    const { script } = await req.json();

    if (typeof script !== "string") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    try {
        const { json, log } = await execRscript(script);
        return NextResponse.json({ json, log });
    } catch (e: any) {
        return NextResponse.json(
            { error: "R script execution failed", errorLog: e?.message ?? "" },
            { status: 422 }
        );
    }
}
