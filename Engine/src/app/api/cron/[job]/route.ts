import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { ALL_JOBS, JOBS, runNamed } from "@/lib/jobs";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // vercel.json schedules every job for every firm: a job whose feature this firm turned off answers at once
  if (ALL_JOBS[job] && !JOBS[job]) return NextResponse.json({ skipped: true, why: "off for this firm" });
  if (!JOBS[job]) return NextResponse.json({ error: "unknown job" }, { status: 404 });
  const r = await runNamed(job);
  revalidatePath("/", "layout");
  return NextResponse.json(r);
}
