import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./progress.css";
import "./v2.css";
// the firm's own colors, last so they win (copied from its brand/theme.css by firm.config.mjs)
import "./firm-theme.css";
import { Shell } from "@/components/Shell";
import { Ticker } from "@/components/Ticker";
import { hasTrends } from "@/lib/queries";
import { sharePreview, siteUrl } from "@/lib/share";
import { firm, DEFAULT_LOOK, BUILDER, SITE_TITLE } from "@/firm";
import { DEFAULT_FONTS } from "@/lib/fonts.mjs";

// The address link previews resolve opengraph-image.jpg against: LinkedIn, Slack and X need an absolute https URL.
const SITE = siteUrl() || "http://localhost:3000";
// user edits these in content/share-preview.md (a unit test holds the lengths).
const SHARE = sharePreview();

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: `Deal sourcing for ${firm.name}: startups, trends, sponsors and funds inside ${firm.short}'s thesis, every fact linked to its source.${BUILDER.name ? ` A demo by ${BUILDER.name}.` : ""}`,
  robots: { index: false, follow: false },
  // The picture is src/app/opengraph-image.jpg (design/share-image/, user's pick "Product Shot", 10-31-26).
  openGraph: { type: "website", siteName: SITE_TITLE, title: SHARE.title, description: SHARE.description, url: "/" },
  twitter: { card: "summary_large_image", title: SHARE.title, description: SHARE.description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: firm.brand?.themeColor || "#1a1b1f",
};

// Scout's own fonts; a firm with its own look names its font file in its profile (brand.fonts, Plan step 11)
const FONTS = firm.brand?.fonts || DEFAULT_FONTS;

// Night is written into the HTML; Day (a saved choice) is applied before paint, and so is a dismissed Start Here panel.
const prePaint = `try{var t=localStorage.getItem("scout.theme");if(t!=="light"&&t!=="dark"&&window.matchMedia)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;var d=localStorage.getItem("scout.density");if(d)document.documentElement.dataset.density=d;var s=localStorage.getItem("scout.text");if(s)document.documentElement.dataset.text=s;var m=localStorage.getItem("scout.motion");if(m==="off")document.documentElement.dataset.motion="off";if(localStorage.getItem("scout.startHere")==="off")document.documentElement.dataset.startHere="off";}catch(e){}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const trends = await hasTrends();
  return (
    <html lang="en" data-theme={DEFAULT_LOOK} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaint }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href={FONTS}
        />
      </head>
      <body>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="gg" x1="0" x2="1">
              <stop offset="0" stopColor="#cc003d" />
              <stop offset="1" stopColor="#ffbe4c" />
            </linearGradient>
          </defs>
        </svg>
        <Shell ticker={<Ticker />} trends={trends}>{children}</Shell>
      </body>
    </html>
  );
}
