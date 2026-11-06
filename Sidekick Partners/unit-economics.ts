// Sidekick's Unit Economics lines, industry by industry (VC Scout Plan section 5; the vault's Scout/Unit Economics.md,
// references re-checked 10-30-26). Each line is filled from a dropped deck, estimated from a public signal, or unknown.
// Only a verified reference with a "good" bar can earn score points; every other line is shown, never scored.
import type { FirmUnitEconomics, UeText } from "../Engine/src/firm/types";

const AMP = { name: "Amp DTC Mega Report, 2025", url: "https://useamp.com/blog/2025-dtc-mega-report/" };
const HIMS = { name: "Hims & Hers FY2025", url: "https://investors.hims.com/news/news-details/2026/Hims--Hers-Health-Inc--Reports-Fourth-Quarter-and-Full-Year-2025-Financial-Results/default.aspx" };
const HINGE = { name: "Hinge Health S-1", url: "https://www.sec.gov/Archives/edgar/data/1673743/000119312525121827/d829170ds1a.htm" };
const ALEPH_PAYBACK = { name: "Aleph × Benchmarkit, 06-26", url: "https://www.getaleph.com/answers/cac-payback-period-saas-2026" };
const ALEPH_LTV = { name: "Aleph × Benchmarkit, 06-26", url: "https://getaleph.com/answers/cltv-cac-ratio-saas-2026" };
const BVP = { name: "Bessemer, State of AI", url: "https://www.bvp.com/atlas/the-state-of-ai-2025" };
const CRV = { name: "CRV, 07-26", url: "https://crv.com/content/how-series-a-investors-evaluate-burn-rate" };
const RAINFOREST = { name: "Rainforest, 06-26", url: "https://www.rainforestpay.com/blog/what-the-2026-embedded-payments-benchmark-reveals-about-vertical-saas" };
const CENSUS = { name: "Census Bureau, County Business Patterns", url: "https://www.census.gov/programs-surveys/cbp.html" };
const FIH = { name: "FIH, GF Data FY2025 and IBBA Q3 2025", url: "https://fih.com/ma-guide/multiples-by-size-and-industry" };
const CAPSTONE = { name: "Capstone, 04-26", url: "https://www.capstonepartners.com/insights/reports-annual-consumer-ma-report/" };
const BENCHMARKIT = { name: "Benchmarkit 2026", url: "https://www.benchmarkit.ai/2026-saas-ai-native-metrics" };
const HIGH_ALPHA = { name: "High Alpha / Growth Unhinged, 11-25", url: "https://kylepoyar.substack.com/p/2025-saas-benchmarks-report" };

/* ---------- estimates: rough reads from a company's own words and its news ---------- */
const words = (t: UeText) => [t.description, ...t.headlines].join("\n");
const names = (t: UeText, re: RegExp, fix: Record<string, string> = {}) =>
  [...new Set([...words(t).matchAll(re)].map((m) => fix[m[0].toLowerCase()] || m[0].replace(/\b\w/g, (c) => c.toUpperCase())))];
const list = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

const RETAILERS = /\b(target|walmart|whole foods|sephora|ulta|costco|sprouts|cvs|walgreens|kroger|erewhon|trader joe's|wegmans|h-e-b|nordstrom|publix|albertsons|safeway|thrive market|credo beauty)\b/gi;
const RETAIL_FIX: Record<string, string> = { cvs: "CVS", "h-e-b": "H-E-B", "trader joe's": "Trader Joe's" };
const retail = (t: UeText) => {
  const r = names(t, RETAILERS, RETAIL_FIX);
  return r.length ? `Its news names ${list(r)}` : null;
};
const subscription = (t: UeText) => (/\bsubscri(?:be|bes|ption|ptions)\b|\bsubscribe (?:&|and) save\b|\bauto-?ship\b|\brefills?\b/i.test(words(t)) ? "Sells by subscription or refill: a weak signal" : null);
const PRICE = /\$\s?(\d{1,4}(?:\.\d{2})?)\s?(?:\/\s?mo(?:nth)?|per month|a month)\b/i;
const price = (t: UeText) => {
  const m = words(t).match(PRICE);
  return m ? `$${m[1]} a month, in its own words` : null;
};
const employer = (t: UeText) => (/\b(?:employers?|employee benefits?|health plans?|payers?|benefits? (?:platform|navigation))\b/i.test(words(t)) ? "Its news names employers or health plans" : null);
const payments = (t: UeText) => (/\b(?:embedded|integrated|card) payments?\b|\bpayment processing\b|\bpayfac\b|\bpayments? (?:and|&) (?:booking|scheduling|billing)\b|\b(?:booking|scheduling|billing),? (?:and|&) payments?\b/i.test(words(t)) ? "Takes payments, in its own words" : null);
const MARKETS = /\b(salons?|med spas?|spas|barbershops?|urgent care|dental (?:practices|offices|clinics)|veterinary (?:clinics|practices)|physical therapy (?:clinics|practices)|fitness studios|gyms|youth sports|restaurants|hvac|plumbers|home services|law firms|accounting firms|property managers|hospices?|home health|clinics)\b/gi;
const markets = (t: UeText) => {
  const m = names(t, MARKETS, { hvac: "HVAC" });
  return m.length ? `Sells to ${list(m.slice(0, 4)).toLowerCase().replace(/\bhvac\b/, "HVAC")}` : null;
};
const deals = (t: UeText) => {
  const n = t.headlines.filter((h) => /\bacquir(?:es|ed|ing)\b|\bacquisition of\b/i.test(h)).length;
  return n ? `${n} ${n === 1 ? "acquisition" : "acquisitions"} in its news` : null;
};

export const unitEconomics: FirmUnitEconomics = {
  asOf: "Benchmarks From 2025-26 Industry Reports",
  lines: {
    /* ---------- Industry 1 · Premium Consumer Brands ---------- */
    "consumer-brands": [
      { key: "grossMargin", label: "Gross Margin", block: "price", ref: "DTC 50-60%, up to 70%; wholesale 35-45%, minus 10-20 points of trade spend", status: "thumb" },
      { key: "contributionMargin", label: "Contribution Margin", block: "price", ref: "Median 48% (35% at $1-5M revenue) · great 50%+", status: "verified", good: { at: 48, unit: "%" }, source: AMP },
      { key: "retailReach", label: "Retail Reach", block: "price", ref: "No public benchmark (needs SPINS or Circana)", status: "none", estimate: retail },
      { key: "cac", label: "CAC", block: "cost", ref: "Median $54; above $84 is a warning · great $15", status: "verified", good: { at: 54, unit: "$", lower: true }, source: AMP },
      { key: "ltvCac", label: "LTV:CAC", block: "value", ref: "Median 2.4x · great 3x+", status: "verified", good: { at: 2.4, unit: "x" }, source: AMP },
      { key: "repeat90", label: "90-Day Repeat Purchase", block: "value", ref: "Median 14.7%; under 10% is a warning · great 25%+", status: "verified", good: { at: 14.7, unit: "%" }, source: AMP, estimate: subscription },
      { key: "cacPayback", label: "CAC Payback", block: "payback", ref: "No public benchmark for brands", status: "none" },
    ],
    /* ---------- Industry 2 · Consumer Health: public companies only, so nothing here scores ---------- */
    "consumer-health": [
      { key: "pricePerMonth", label: "Price Per Month", block: "price", ref: "Hims $83 a month per subscriber (a public company, not a startup bar)", status: "verified", source: HIMS, estimate: price },
      { key: "grossMargin", label: "Gross Margin", block: "price", ref: "Hims 74%; employer channel: Hinge Health 80%, Omada 61% (public companies, not startup bars)", status: "verified", source: HIMS },
      { key: "marketingShare", label: "Marketing As % of Revenue", block: "cost", ref: "Hims about 39% (a public company, not a startup bar)", status: "verified", source: HIMS },
      { key: "employerChannel", label: "Employer Channel", block: "cost", ref: "Employer CAC about $11K vs. about $170 to consumers (Rock Health, 2023)", status: "fyi", estimate: employer },
      { key: "ndr", label: "Net Dollar Retention", block: "value", ref: "Hinge Health 117% (a public company, not a startup bar)", status: "verified", source: HINGE },
      { key: "churnPayback", label: "Churn and Payback", block: "payback", ref: "No independent Seed or Series A benchmark; 3-6 months is a rule of thumb", status: "none" },
    ],
    /* ---------- Industry 3 · E-Commerce Software ---------- */
    "ecommerce-software": [
      { key: "price", label: "Price", block: "price", ref: "No reference: pricing varies", status: "none", estimate: price },
      // the $1-5M ARR bar; under $1M ARR the median is 75%
      { key: "arrGrowth", label: "ARR Growth", block: "price", ref: "Median 75% under $1M ARR, 40% at $1-5M (B2B SaaS) · great about 300%", status: "verified", good: { at: 40, unit: "%" }, source: HIGH_ALPHA },
      { key: "grossMargin", label: "Gross Margin", block: "price", ref: "AI-heavy tools about 60% · median 77% (reported)", status: "verified", good: { at: 60, unit: "%" }, source: BVP },
      { key: "cacPayback", label: "CAC Payback", block: "cost", ref: "Median 11 months under $5K a year per customer · great 6 or less", status: "verified", good: { at: 11, unit: "months", lower: true }, source: ALEPH_PAYBACK },
      { key: "nrr", label: "Net Revenue Retention", block: "value", ref: "Median 98% per seat, 108% on usage (all B2B SaaS) · great 120%+", status: "verified", good: { at: 98, unit: "%" }, source: BENCHMARKIT },
      { key: "burnMultiple", label: "Burn Multiple", block: "payback", ref: "1.5-2.0x is acceptable at Series A · under 1.0x is exceptional", status: "verified", good: { at: 2, unit: "x", lower: true }, source: CRV },
    ],
    /* ---------- Industry 4 · Vertical SaaS + Embedded Payments ---------- */
    "vertical-saas": [
      { key: "paymentsAttached", label: "Payments Attached", block: "price", ref: "Mature leaders: 78% of customers use it, 35% of revenue", status: "verified", source: RAINFOREST, estimate: payments },
      { key: "takeRate", label: "Take Rate", block: "price", ref: "No public median; 0.5-1% of payment volume is a rule of thumb", status: "thumb" },
      { key: "marketsServed", label: "Markets Served", block: "price", ref: "The markets it sells into, from its site and press", status: "none", estimate: markets },
      { key: "marketSize", label: "Market Size", block: "price", ref: "Businesses in each market × what each pays a year; never scored", status: "thumb", source: CENSUS },
      { key: "cacPayback", label: "CAC Payback", block: "cost", ref: "Median 16 months across all B2B SaaS · vertical about 18 (reported) · great 6 or less", status: "verified", good: { at: 16, unit: "months", lower: true }, source: ALEPH_PAYBACK },
      { key: "ltvCac", label: "LTV:CAC", block: "value", ref: "Vertical median 5.6x (horizontal 4.1x), 146 companies", status: "verified", good: { at: 5.6, unit: "x" }, source: ALEPH_LTV },
      { key: "grossMargin", label: "Gross Margin", block: "value", ref: "Median 77% (reported)", status: "reported" },
      { key: "nrr", label: "Net Revenue Retention", block: "value", ref: "100%+ (reported)", status: "reported" },
    ],
    /* ---------- Industry 5 · Tech-Enabled Roll-Ups + AI Services ---------- */
    "roll-ups": [
      { key: "revenuePerEmployee", label: "Revenue Per Employee", block: "price", ref: "$175K median per employee, all B2B SaaS · best-in-class $350-400K (reported)", status: "verified", good: { at: 175000, unit: "$" }, source: BENCHMARKIT },
      { key: "ebitdaMargin", label: "EBITDA Margin at Purchase", block: "price", ref: "Median 27% (search funds, 2024 study; reported)", status: "reported" },
      { key: "aiGrossMargin", label: "AI-Services Gross Margin", block: "price", ref: "No benchmark: claims run from 30-40% profit targets to 80-90% projections", status: "none" },
      { key: "purchaseMultiple", label: "Purchase Multiple", block: "cost", ref: "4.0x EBITDA for $2-5M deals, 5.3x for $5-50M · search funds 6.2-7x (reported)", status: "verified", good: { at: 5.3, unit: "x", lower: true }, source: FIH },
      { key: "exitMultiple", label: "Exit Multiple", block: "value", ref: "PE-backed deals 7.2x; consumer 2025: strategic buyers 8.6x, PE 10.4x", status: "verified", source: CAPSTONE },
      { key: "acquisitionPace", label: "Acquisition Pace", block: "payback", ref: "Firms bought so far, from press and filings", status: "none", estimate: deals },
    ],
  },
  // Consumer Health's references are public companies (Hims, Hinge Health), never startup bars, so a Consumer Health
  // deck is scored out of 80 and says why (user, 11-02-26: "score it out of 80 and state that it is scored differently")
  unscored: { "consumer-health": "Free benchmarks for private Consumer Health companies are still being fine-tuned; they arrive in Phase II." },
  fyi: [
    { areas: ["consumer-brands"], re: /\b(beauty|skin ?care|hair ?care|scalp|cosmetics?|makeup|fragrance|personal care|body ?care)\b/i, text: "XRC Ventures' beauty-investor survey (Q1 2024): $500K-1M sales, 40-50%+ growth, 55-60% gross margin, 30-35% repurchase, LTV:CAC 2.5-3x. Three years old and beauty only: FYI, never scored." },
    { areas: ["consumer-brands"], re: /\b(beauty|skin ?care|hair ?care|scalp|cosmetics?|makeup|fragrance|personal care|body ?care)\b/i, text: "XRC Ventures' 2026 beauty report (16 investors): sales growth and repurchase rate remain top priorities. FYI, never scored.", url: "https://brandcapitalfund.substack.com/p/consumer-benchmark-report-beauty" },
    { areas: ["consumer-health"], text: "Rock Health's digital-health mile markers (2023): FYI, never scored.", url: "https://rockhealth.com/insights/on-the-road-to-impact-mile-markers-for-early-stage-digital-health-startups/" },
  ],
};
