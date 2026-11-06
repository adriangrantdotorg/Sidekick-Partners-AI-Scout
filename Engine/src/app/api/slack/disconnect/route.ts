import { NextResponse } from "next/server";
import { on } from "@/firm";
import { disconnectSlack } from "@/lib/slack";

export async function POST() {
  if (!on("slack")) return new NextResponse(null, { status: 404 }); // a firm without Slack has no Slack routes
  await disconnectSlack();
  return NextResponse.json({ ok: true });
}
