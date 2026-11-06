// The Funding menu's pages at the firm's own addresses (VC Scout Plan step 9): Sidekick's /filings, /co-investors and
// /synergistic-funds; Courtside's frozen profile keeps its live /throw-some-ds, /neighborhood and /synergistic-funders.
// Only those three are served, plus a firm's old address for one (Sidekick's /consumer-funds, renamed 11-04-26), which
// sends the visitor on; any other one-segment address is a 404.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { FilingsPage } from "@/components/FilingsPage";
import { FundPage } from "@/components/FundPage";
import { FUNDING_PAGES, MOVED_FUNDING } from "@/lib/funding-pages";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return [...Object.keys(FUNDING_PAGES), ...Object.keys(MOVED_FUNDING)].map((funding) => ({ funding }));
}

export async function generateMetadata({ params }: { params: Promise<{ funding: string }> }): Promise<Metadata> {
  const { funding } = await params;
  return { title: FUNDING_PAGES[funding]?.title };
}

export default async function Page({ params }: { params: Promise<{ funding: string }> }) {
  const { funding } = await params;
  if (MOVED_FUNDING[funding]) permanentRedirect(MOVED_FUNDING[funding]);
  const p = FUNDING_PAGES[funding];
  if (!p) notFound();
  if (p.page === "filings") return <FilingsPage />;
  return <FundPage kind={p.page === "coInvestors" ? "neighborhood" : "synergistic"} />;
}
