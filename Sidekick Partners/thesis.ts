// Sidekick's thesis: its five industries with their keywords, the filters that keep a find inside the thesis, and the
// plays it has backed (VC Scout Plan, sections 1, 2 and 4; Sidekick Thesis (Enhanced) and the six _Research files).
import type { FirmThesis } from "../Engine/src/firm/types";

// Strong terms count 1 point; weak terms count half. Traps are removed before matching. Terms are lowercase.
const TERMS: Record<string, { strong: string[]; weak: string[] }> = {
  "consumer-brands": {
    strong: ["consumer brand", "consumer brands", "cpg", "consumer packaged goods", "dtc brand", "direct-to-consumer", "d2c", "better-for-you", "better for you", "functional beverage", "functional beverages", "functional food", "prebiotic soda", "sparkling water", "energy drink", "cold brew", "creamer", "snack brand", "snacks", "protein bar", "protein snacks", "ice cream", "cereal", "granola", "hot sauce", "condiments", "plant-based", "non-alcoholic", "ready-to-drink", "spirits brand", "skincare", "skin care", "haircare", "hair care", "bodycare", "body care", "personal care", "beauty brand", "cosmetics", "makeup", "fragrance", "deodorant", "sunscreen", "hand sanitizer", "clean beauty", "baby care", "pet food", "apparel brand", "activewear", "athleisure", "footwear", "luggage", "home goods", "premium brand", "now at target", "whole foods", "sephora", "ulta", "costco", "retail doors", "on shelves"],
    weak: ["brand", "beauty", "food", "beverage", "drinks", "snack", "coffee", "tea", "apparel", "fashion", "grocery", "wholesale", "retail", "shoppers", "aisle", "flavors"],
  },
  "consumer-health": {
    strong: ["consumer health", "digital health", "telehealth", "virtual care", "at-home testing", "at-home test", "at-home lab", "lab testing", "biomarkers", "blood test", "blood panel", "longevity", "glp-1", "weight loss", "metabolic health", "peptides", "hormone", "menopause", "fertility", "ivf", "egg freezing", "maternal health", "pregnancy", "mental health", "therapy app", "sleep", "supplements", "supplement", "vitamins", "probiotics", "wellness", "employee benefits", "employer benefits", "benefits navigation", "care navigation", "caregiving", "health benefits", "wearable", "fitness", "physical therapy", "nutrition", "clinician-guided", "cash-pay", "incontinence"],
    weak: ["health", "healthcare", "clinic", "patients", "doctor", "workout", "gym", "diet", "recovery", "protein", "hydration", "electrolytes"],
  },
  "ecommerce-software": {
    strong: ["shopify", "shopify app", "shopify plus", "shopify merchants", "e-commerce software", "ecommerce software", "commerce platform", "commerce software", "online store", "for brands", "for dtc brands", "checkout", "agentic commerce", "agentic checkout", "conversational commerce", "upsell", "upsells", "cross-sell", "post-purchase", "loyalty program", "loyalty platform", "rewards program", "referral program", "subscription app", "subscriptions for brands", "returns management", "recommerce", "branded resale", "retail media", "retention marketing", "product reviews", "product discovery", "product recommendations", "personalization", "answer engine optimization", "generative engine optimization", "ai search visibility", "amazon sellers", "marketplace sellers", "headless commerce", "smart cart", "fitting room", "customer support agents", "ugc", "product photography"],
    weak: ["e-commerce", "ecommerce", "merchants", "storefront", "catalog", "commerce", "retailers", "conversion", "average order value", "aov", "cart"],
  },
  "vertical-saas": {
    strong: ["vertical saas", "vertical software", "embedded payments", "embedded fintech", "payment processing", "payments platform", "payfac", "invoicing", "accounts receivable", "accounts payable", "usage-based billing", "billing platform", "payroll", "earned wage access", "on-demand pay", "pay-by-bank", "open banking", "practice management", "booking software", "scheduling software", "salon", "salons", "med spa", "spas", "urgent care", "hospice", "home health", "dental", "veterinary", "emr", "ehr", "revenue cycle", "property management software", "commercial real estate", "construction software", "field service", "hvac", "sports facilities", "fitness studios", "insurtech", "insurance software", "commercial insurance", "insurance distribution", "benefits brokers", "fund accounting", "private markets", "portfolio monitoring", "ai receptionist", "front desk", "system of record", "msps", "managed service providers"],
    weak: ["saas", "software", "fintech", "payments", "insurance", "operators", "small businesses", "smb", "smbs", "workflow", "platform", "clinics"],
  },
  "roll-ups": {
    strong: ["roll-up", "rollup", "roll-ups", "tech-enabled services", "tech-enabled", "ai-enabled services", "ai services", "ai-native services", "services firm", "services firms", "accounting firm", "accounting firms", "cpa firm", "cpa firms", "bookkeeping", "tax preparation", "insurance agency", "insurance agencies", "mga", "managing general agent", "search fund", "buy-and-build", "buy and build", "acquires firms", "acquiring firms", "lower middle market", "lower-middle-market", "fragmented industry", "care coordination", "home services", "law firms", "staffing firm"],
    weak: ["services", "firms", "agency", "agencies", "acquisition", "acquisitions", "consolidation", "consolidator", "platform company", "tuck-in"],
  },
};

// Each industry's sky, for a startup with no colors of its own: Sidekick's greens and the brass of the page look.
const SKY: Record<string, { base: string; sun: string }> = {
  "consumer-brands": { base: "#1b5d4a", sun: "#f2c66d" },
  "consumer-health": { base: "#14595a", sun: "#9ef0c4" },
  "ecommerce-software": { base: "#223e3f", sun: "#30e1ae" },
  "vertical-saas": { base: "#1d3b4f", sun: "#7fd4ff" },
  "roll-ups": { base: "#3a3320", sun: "#d9b26a" },
};

const LABEL: Record<string, string> = {
  "consumer-brands": "Premium Consumer Brands",
  "consumer-health": "Consumer Health",
  "ecommerce-software": "E-Commerce Software",
  "vertical-saas": "Vertical SaaS + Embedded Payments",
  "roll-ups": "Tech-Enabled Roll-Ups + AI Services",
};

/** Industry keys in the order chips, filters and the AI Thesis Check list them (Plan section 1). */
export const INDUSTRIES = ["consumer-brands", "consumer-health", "ecommerce-software", "vertical-saas", "roll-ups"];

// Geography (Plan section 2, Thesis section 5): US first; New York City and Dallas-Fort Worth, Sidekick's two offices,
// get the boost; the UK and Israel, where the portfolio also reaches, get part; anywhere else abroad gets less.
const NEAR = /\b(new york|nyc|manhattan|brooklyn|dallas|fort worth|dfw|plano|frisco)\b/i;
const PARTIAL = /\b(uk|united kingdom|britain|british|london|manchester|edinburgh|israel|israeli|tel aviv)\b/i;
const ABROAD = /\b(uk|united kingdom|britain|british|london|israel|israeli|tel aviv|europe|european|berlin|paris|germany|france|spain|amsterdam|stockholm|india|indian|bangalore|bengaluru|brazil|mexico|latam|nigeria|kenya|uae|dubai|saudi|egypt|japan|korea|china|singapore|australia|canada|toronto)\b/i;

export const thesis: FirmThesis = {
  areas: INDUSTRIES.map((key) => ({ key, label: LABEL[key], ...TERMS[key], sky: SKY[key] })),
  traps: [
    /\bcustomer acquisition\b/gi, /\bacquisition costs?\b/gi, /\btalent acquisition\b/gi, /\buser acquisition\b/gi,
    /\broll(?:s|ed|ing)? up (?:their|our|your|his|her|my) sleeves\b/gi, /\bplayers? in the (?:market|space|industry)/gi,
    /\bgame[- ]changer/gi, /\bdata center/gi,
    // "recovery" is health only for bodies: never debt, data or costs (Courtside's backfill, 10-26-26)
    /\b(?:debt|asset|cost|data|disaster|revenue|payment|loan|cart) recovery\b/gi,
  ],
  // drug makers and hospitals are not consumer health; card networks and banks are not vertical software
  demote: [
    { area: "consumer-health", re: /\b(pharma|pharmaceuticals?|biotech|drug discovery|clinical trials?|therapeutics|medical devices?|oncology)\b/, by: 2 },
    { area: "vertical-saas", re: /\b(crypto|stablecoins?|blockchain|bitcoin)\b/, by: 2 },
  ],
  // Sidekick buys software for salons and clinics, and the service firms themselves (Industries 4 and 5), so only a
  // charity, a church or one food truck is never venture scale here (Plan section 2: "flip it")
  notVentureScale: /\b(nonprofit|non-profit|charity|church|ministry|food truck|bar and grill)\b/i,
  formD: {
    drop: /pooled investment fund|reits|oil and gas|coal|mining|lodging|investing|energy conservation|electric utilities|agriculture|airlines|manufacturing/i,
    // fund vehicles only: "holdings" and "group" stay in, as possible roll-up vehicles (Plan section 2)
    dropName: /\b(fund|lp|l\.p\.|reit|capital partners|properties|realty|trust|spv|a series of|feeder|opportunity|offshore|master|co-invest|energy|oil|gas|mining|pharma|pharmaceuticals|therapeutics|biosciences)\b/i,
    // a group that names an industry makes every filing in it a find, so only two narrow ones do; insurance,
    // banking and business services filings get in by their names (CoverForce, StartSure)
    industries: {
      "Other Health Care": "consumer-health",
      "Health Insurance": null,
      Biotechnology: null,
      Pharmaceuticals: null,
      Retailing: "consumer-brands",
      Restaurants: null,
    },
  },
  // bets that need a technology cycle or a long science timeline to pay off (Thesis section 5, "less likely to fit")
  outside: /\b(crypto|cryptocurrency|blockchain|web3|nfts?|defi|tokens?|stablecoins?|bitcoin|ethereum|frontier models?|foundation models?|model lab|agi|drug discovery|gene therapy|gene editing|biotech|clinical-stage|therapeutics|quantum|fusion|nuclear|satellites?|space launch|semiconductors?|chips?|robotaxi|autonomous vehicles?|evtol|astrology|astrologers?)\b/i,
  incumbent: /^(google|apple|meta|amazon|microsoft|samsung|sony|netflix|disney|walmart|target|costco|kroger|procter|p&g|unilever|pepsico|coca-cola|nestl[eé]|l'or[eé]al|est[eé]e lauder|church & dwight|kenvue|haleon|johnson & johnson|cvs|walgreens|unitedhealth|optum|labcorp|quest diagnostics|shopify|stripe|square|block|paypal|intuit|salesforce|oracle|adp|toast|instacart|doordash|uber)\b/i,
  stages: ["seed", "series-a"],
  // pre-seed gets half the stage points: Sidekick wants paying customers (Plan section 2)
  stageShare: { "pre-seed": 0.5 },
  stageLabel: "Seed and Series A (Pre-Seed half), a $1M to $10M check",
  // my default; Sidekick's real check size isn't public (Plan section 2)
  check: { minCheck: 1_000_000, maxCheck: 10_000_000 },
  // $30M total raised keeps Series A companies in (Plan section 2, my default)
  capUsd: 30_000_000,
  geo: {
    label: "US first; New York City and Dallas-Fort Worth best; UK and Israel partial",
    abroad: ABROAD,
    // NYC and DFW 5 of 5, the rest of the US (or no place named) 4, UK and Israel 3, elsewhere 2
    share: (text) => (NEAR.test(text) ? 1 : PARTIAL.test(text) ? 0.6 : ABROAD.test(text) ? 0.4 : 0.8),
  },
  // the plays Sidekick has backed, each named by its portfolio company (Thesis sections 2 and 4)
  plays: [
    { key: "premium-aisle", label: "a premium take on a tired aisle", parallel: "Touchland", re: /\b(premium|elevated|better-for-you|clean|reimagin\w*|modern take|upgrade)\b.{0,60}\b(sanitizer|deodorant|soap|creamer|cereal|ice cream|snacks?|hot sauce|sunscreen|toothpaste|razors?|scrubs|bodycare|body wash|haircare|condiments?|coffee|tea|water)\b/i, areas: ["consumer-brands"] },
    { key: "protein-creep", label: "protein and fiber in foods people already buy", parallel: "Seven Sundays", re: /\b(high[- ]protein|protein[- ](?:packed|infused|rich)|added protein|grams of protein|fiber|prebiotic|gut health)\b/i, areas: ["consumer-brands", "consumer-health"] },
    { key: "beauty-efficacy", label: "clinical skincare and haircare", parallel: "Crown Affair", re: /\b(clinical (?:skin ?care|hair ?care|beauty|results|strength|formula\w*)|dermatologist[- ](?:developed|tested|recommended|backed|founded|grade)|skinification|scalp (?:care|serums?|health)|serums?|retinol|peptides? (?:skin ?care|serums?|creams?)|efficacy-(?:led|driven|first))\b/i, areas: ["consumer-brands"] }, // 11-04-26: "clinical" alone matched clinical health care
    { key: "at-home-health", label: "at-home testing with a repeat purchase", parallel: "Everlywell", re: /\b(at[- ]home (?:test|testing|lab|kit)|biomarkers?|blood (?:test|panel)|test kits?|lab results)\b/i, areas: ["consumer-health"] },
    { key: "employer-health", label: "health paid for by employers", parallel: "Ovia Health", re: /\b(employers?|employee benefits?|benefits? (?:navigation|platform)|health plans?|payers?)\b/i, areas: ["consumer-health", "roll-ups"] },
    { key: "shopify-tools", label: "Shopify tools that pay back fast", parallel: "Rebuy", re: /\b(shopify (?:apps?|plus|merchants?|brands?|stores?|plugins?|sellers?)|upsells?|cross-sells?|post-purchase|average order value|aov|loyalty (?:apps?|platforms?|software|tools?)|subscriptions? (?:apps?|platforms?|software|management|tools?)|retention (?:platforms?|software|tools?))\b/i, areas: ["ecommerce-software"] }, // 11-04-26: "shopify" and "loyalty" alone matched Shopify's own funding and Nespresso's loyalty program
    { key: "agentic-commerce", label: "AI as a new storefront", parallel: "Lantern Platform", re: /\b(agentic (?:commerce|checkout)|ai (?:shopping|search|agents?)|answer engine|generative engine|chatgpt|conversational commerce)\b/i, areas: ["ecommerce-software"] },
    { key: "vertical-payments", label: "software that runs a service business, with payments attached", parallel: "Mangomint", re: /\b(salons?|spas?|clinics?|facilit(?:y|ies)|studios?|practices?|urgent care|hospice)\b.{0,80}\b(payments?|booking|scheduling|billing|receptionist|front desk)\b|\bembedded payments\b/i, areas: ["vertical-saas"] },
    { key: "money-rails", label: "the rails money moves on", parallel: "DailyPay", re: /\b(earned wage|on-demand pay|pay-by-bank|open banking|accounts (?:receivable|payable)|usage-based billing|invoic\w+|payouts?)\b/i, areas: ["vertical-saas"] },
    { key: "ai-roll-up", label: "buying service firms and running them on software", parallel: "LedgerWay", re: /\b(roll-?ups?|acquir\w+ (?:accounting|cpa|insurance|service|law|bookkeeping) (?:firms|practices|agencies)|tech-enabled services?|ai-(?:enabled|native) services?|buy[- ]and[- ]build)\b/i, areas: ["roll-ups"] },
  ],
  // Scout presumes no deck (user, 11-02-26: "view it as an accessory not a prerequisite"): Unit Economics scored
  // only a deck's figures, so its 20 points went 5 each to Thesis Fit, Stage and Check, Signal Strength and Team.
  // Culture's 15 left with the Culture page (step 9). The parts add up to 100, before the team's votes.
  weights: { thesis: 35, stage: 25, signal: 20, culture: 0, unitEconomics: 0, team: 15, geo: 5 },
};
