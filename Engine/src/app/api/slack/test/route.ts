import { NextResponse } from "next/server";
import { slackPost } from "@/lib/slack";
import { firm, on } from "@/firm";

export async function POST(req: Request) {
  if (!on("slack")) return new NextResponse(null, { status: 404 }); // a firm without Slack has no Slack routes
  const { text } = await req.json().catch(() => ({}));
  const r = await slackPost(String(text || `A test message from ${firm.product}.`));
  if (r === null) return NextResponse.json({ error: "Slack isn't connected yet." }, { status: 409 });
  if (!r) return NextResponse.json({ error: "Slack did not accept the message." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
