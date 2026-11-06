// Sidekick's likely buyers: the strategic buyers in its industries, their venture arms and the deals they did (VC Scout
// Plan section 5, Likely Acquirers; comps checked 10-30-26, venture arms 10-31-26 and in Plan step 8). Claude-checked:
// they change when we add a deal, not daily. Read by Likely Acquirers (Plan step 10); never scored.
import type { BuyerDeal, ExitNote, FirmBuyer } from "../Engine/src/firm/types";

const SIDEKICK = "https://www.sidekickpartners.com/pages/portfolio";
const deal = (company: string, date: string, price: string, url: string, verified: boolean, multiple?: string): BuyerDeal => ({ company, date, price, url, verified, multiple });

export const buyers: FirmBuyer[] = [
  /* ---------- Premium Consumer Brands ---------- */
  {
    name: "Church & Dwight",
    areas: ["consumer-brands"],
    // no venture arm found (10-31-26)
    deals: [deal("Touchland", "2025-05-12", "$700M plus up to $180M earn-out", "https://investor.churchdwight.com/Investors/news/news-details/2025/Church--Dwight-to-Acquire-the-Touchland-Brand-for-700-million-Plus-Earn-out/default.aspx", true, "5.4x sales, 12.7x EBITDA on the base price")],
  },
  {
    name: "Unilever",
    areas: ["consumer-brands", "consumer-health"],
    // held 13.2% of Nutrafol before Unilever bought a majority (announced 05-31-22)
    ventureArm: { name: "Unilever Ventures", proof: "https://nutraingredients-usa.com/Article/2022/06/13/unilever-acquires-majority-stake-in-hair-wellness-company-nutrafol", verified: true, story: "Unilever Ventures held 13.2% of Nutrafol before Unilever bought a majority (05-31-22)." },
    deals: [
      deal("Grüns", "2026-04-09", "about $1.2B, price undisclosed (Axios Pro, Forbes)", "https://www.unilever.com/news/press-and-media/press-releases/2026/unilever-to-acquire-us-greens-supplement-company-gruns/", false, "about 4x sales"),
      deal("Dr. Squatch", "2025-06", "$1.5B, reported by the FT", "https://cosmeticsbusiness.com/unilever-to-pay-1-5-billion-for-men-s-grooming", false),
    ],
  },
  {
    name: "PepsiCo",
    areas: ["consumer-brands"],
    // reported to have backed KeVita and Health Warrior before buying them; no 2026 deals found
    ventureArm: { name: "PepsiCo Ventures Group", proof: "https://fooddigital.com/drink/pepsico-ventures-group-accelerating-startups-through-nutrition-greenhouse", verified: false, story: "PepsiCo Ventures Group is reported to have backed KeVita and Health Warrior before PepsiCo bought them." },
    deals: [
      deal("Poppi", "2025-05-19", "$1.95B, $1.65B net of tax benefits", "https://www.pepsico.com/newsroom/press-releases/2025/pepsico-completes-acquisition-of-poppi-accelerating-strategic-portfolio-transformation", true),
      deal("Siete Foods", "2024-10-01", "$1.2B", "https://www.pepsico.com/newsroom/press-releases/2024/pepsico-to-acquire-siete-foods-for-1-2-billion", true),
    ],
  },
  {
    name: "Refresco",
    areas: ["consumer-brands"],
    deals: [deal("SunOpta", "2026-05-01", "about $1.2B", "https://www.capstonepartners.com/insights/article-beverage-market-update/", false, "11.6x EBITDA, 1.5x revenue (Capstone)")],
  },
  {
    name: "Wells Enterprises",
    areas: ["consumer-brands"],
    deals: [deal("Halo Top", "2019-09", "terms undisclosed", "https://www.nosh.com/news/2019/halo-top-sold-to-blue-bunny-bunny-producer/", false)],
  },
  { name: "MPearlRock", areas: ["consumer-brands"], deals: [deal("Nutpods", "2024", "terms undisclosed", SIDEKICK, false)] },
  // active buyers with no comp loaded yet (Capstone Partners' Annual Consumer M&A Report, 04-26)
  ...["L'Oréal", "Procter & Gamble", "Estée Lauder", "Shiseido", "Puig", "e.l.f. Beauty", "Coca-Cola", "Keurig Dr Pepper", "General Mills", "Mondelez"].map((name): FirmBuyer => ({ name, areas: ["consumer-brands"], deals: [] })),

  /* ---------- Consumer Health ---------- */
  { name: "Labcorp", areas: ["consumer-health"], deals: [deal("Ovia Health", "2021-08", "terms undisclosed", SIDEKICK, false)] },
  // likely buyers named by Rock Health's Q3 2026 market update, no comp loaded yet
  ...["Quest Diagnostics", "Hims & Hers", "Hinge Health", "Omada Health", "Kenvue", "Haleon", "Nestlé Health Science"].map((name): FirmBuyer => ({ name, areas: ["consumer-health"], deals: [] })),

  /* ---------- E-Commerce Software ---------- */
  {
    name: "Instacart",
    areas: ["ecommerce-software"],
    deals: [deal("Caper", "2021-10-19", "about $350M, cash and stock", "https://www.grocerydive.com/news/instacart-buys-smart-cart-maker-caper-ai-for-350m/608438/", true)],
  },
  { name: "Relay Commerce", areas: ["ecommerce-software"], deals: [deal("Smartrr", "2025", "terms undisclosed", SIDEKICK, false)] },

  /* ---------- Vertical SaaS + Embedded Payments ---------- */
  // software that runs a service business, with payments attached (Mangomint's play); Claude-checked 11-04-26: each
  // source opened and read for the deal (user, 11-04-26: "ok you can build this"). None has a venture arm Scout could
  // prove; Shift4 Ventures shows only on a third-party tracker, so it is left out.
  {
    name: "ServiceTitan",
    areas: ["vertical-saas"],
    deals: [
      deal("FieldRoutes", "2022-01-04", "terms undisclosed", "https://www.servicetitan.com/press/fieldroutes-acquisition", true),
      deal("Aspire", "2021-06-30", "terms undisclosed", "https://www.youraspire.com/news/aspire-software-to-be-acquired-by-servicetitan", true),
    ],
  },
  {
    name: "Shift4",
    areas: ["vertical-saas"],
    deals: [deal("Revel Systems", "2024-05", "$250M in cash", "https://www.paymentsdive.com/news/shift4-point-of-sale-revel-pos-merger-acquisition-payment/715958/", false)],
  },
  {
    name: "Zenoti",
    areas: ["vertical-saas"],
    deals: [deal("SuperSalon", "2021-09-14", "terms undisclosed", "https://www.zenoti.com/press/zenoti-acquires-supersalon-to-consolidate-leadership-in-salon-and-spa-software", true)],
  },
  {
    name: "Lightspeed",
    areas: ["vertical-saas"],
    deals: [deal("Upserve", "2020-12-01", "$430M in cash and stock", "https://investors.lightspeedhq.com/English/newsroom/news-details/2020/Lightspeed-Announces-Acquisition-of-Upserve-to-Further-Omnichannel-Revolution-of-American-Restaurant-Industry-2020-12-1/default.aspx", true)],
  },
  {
    name: "Mindbody",
    areas: ["vertical-saas"],
    deals: [deal("Booker", "2018-03-12", "about $150M in cash", "https://www.mindbodyonline.com/company/press/mindbody-to-acquire-booker-software", true)],
  },

  /* ---------- Tech-Enabled Roll-Ups + AI Services ---------- */
  { name: "Vouch", areas: ["roll-ups"], deals: [deal("StartSure", "2025", "terms undisclosed", SIDEKICK, false)] },
];

// Dated facts under Likely Acquirers (Plan section 5, checked 10-30-26), never scored.
export const exitNotes: ExitNote[] = [
  { text: "75% of 2025's venture-backed acquisitions came after only a Series A (PitchBook-NVCA, Q3 2025).", url: "https://nvca.org/wp-content/uploads/2025/10/Q3-2025-PitchBook-NVCA-Venture-Monitor.pdf" },
  { areas: ["consumer-health"], text: "Exit pace: 164 digital health acquisitions through Q3 2026, against 172 by the same point of 2025 (Rock Health).", url: "https://rockhealth.com/insights/q3-2026-market-update-crystallizing-fifteen-years-of-digital-health/" },
  { areas: ["consumer-brands", "roll-ups"], text: "Consumer deals in 2025: strategic buyers paid a median 8.6x EBITDA, private equity 10.4x (Capstone Partners).", url: "https://www.capstonepartners.com/insights/reports-annual-consumer-ma-report/" },
];
