// Sidekick's sources and portfolio page (VC Scout Plan, section 3). The portfolio list on sidekickpartners.com shows
// names only, so each company's details come from the Sidekick Portfolio Map (86 of 102 names identified, 10-29-26).
import type { FirmPortfolio, FirmSources, PortfolioCo } from "../Engine/src/firm/types";

export const sources: FirmSources = {
  // each runs twice a day with Scout's funding words (Seed, Series A, raises) added
  newsQueries: [
    '"consumer brand" OR CPG OR "better-for-you" OR beverage OR snacks OR skincare OR haircare OR beauty',
    '"consumer health" OR telehealth OR "at-home testing" OR supplements OR wellness OR longevity OR fertility',
    'Shopify OR "e-commerce" OR "agentic commerce" OR checkout OR loyalty OR "for brands"',
    '"vertical software" OR "vertical SaaS" OR "embedded payments" OR payments OR salons OR "urgent care" OR insurtech',
    '"roll-up" OR "tech-enabled services" OR "AI services" OR "accounting firms" OR "insurance agency"',
    '"Whole Foods" OR Target OR Sephora OR Ulta OR Costco OR "retail launch"',
  ],
  // consumer, retail, commerce, payments, health and insurance trade titles, each checked 10-31-26 (an item dated that
  // week); Fierce Healthcare blocks readers (403) and FoodNavigator-USA has no feed of its own
  feeds: [
    ["Modern Retail", "https://www.modernretail.co/feed/"],
    ["Retail Dive", "https://www.retaildive.com/feeds/news/"],
    ["Food Dive", "https://www.fooddive.com/feeds/news/"],
    ["NOSH", "https://www.nosh.com/feed/"],
    ["BevNET", "https://www.bevnet.com/feed/"],
    ["Glossy", "https://www.glossy.co/feed/"],
    ["Beauty Independent", "https://www.beautyindependent.com/feed/"],
    ["Healthcare Dive", "https://www.healthcaredive.com/feeds/news/"],
    ["Practical Ecommerce", "https://www.practicalecommerce.com/feed"],
    ["Payments Dive", "https://www.paymentsdive.com/feeds/news/"],
    ["Fintech Business Weekly", "https://fintechbusinessweekly.substack.com/feed"],
    ["Insurance Journal", "https://www.insurancejournal.com/rss/news/"],
    ["TechCrunch Venture", "https://techcrunch.com/category/venture/feed/"],
    ["Crunchbase News", "https://news.crunchbase.com/feed/"],
  ],
  appGenres: { "6013": "Health & Fitness", "6023": "Food & Drink", "6024": "Shopping", "6015": "Finance", "6012": "Lifestyle", "6000": "Business" },
  // Y Combinator's B2B and SMB companies are in for Sidekick (Plan section 2); technology-cycle bets are out
  yc: {
    in: ["consumer", "b2b", "fintech", "healthcare", "retail", "e-commerce", "ecommerce", "payments", "insurance", "marketplace", "food", "beauty"],
    out: ["crypto", "web3", "blockchain", "biotech", "therapeutics", "drug discovery", "aerospace", "quantum", "semiconductor", "developer tools", "security"],
  },
  githubQueries: ["shopify", "ecommerce", "payments"],
  gdeltQuery: '(startup OR "seed round" OR "Series A") ("consumer brand" OR "consumer health" OR Shopify OR "vertical software" OR "roll-up")',
};

// the names on the list page no one could pin to one company (Sidekick Portfolio Map, "Not identified"): left out, so
// a word like "Vault" or "Solve" never reads as a portfolio company
const UNIDENTIFIED = new Set(["Aperia", "Aurie", "Candid", "Connect America", "Fairloan", "Flagship", "Green Tank", "Iota", "MyMo", "Pretzel", "Smart Co", "Solve", "Squeeze", "TMG", "Vault", "Yumbin"]);

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&#x27;/g, "'").replace(/&quot;/g, '"');

/** Every company name on sidekickpartners.com/pages/portfolio-list: one <p> per name in three text columns. */
export function portfolioNames(html: string): string[] {
  const out: string[] = [];
  for (const block of html.matchAll(/<div class="column__text rte[^"]*">([\s\S]*?)<\/div>/g))
    for (const p of block[1].matchAll(/<p>([\s\S]*?)<\/p>/g)) {
      const n = decode(p[1].replace(/<[^>]+>/g, "")).replace(/[\u200b\u00a0]/g, " ").replace(/\s+/g, " ").trim();
      if (!n || n.length > 40) continue;
      // the page breaks one name over two lines
      if (n === "Platform" && out.at(-1) === "Lantern") {
        out[out.length - 1] = "Lantern Platform";
        continue;
      }
      out.push(n);
    }
  return out.filter((n) => !UNIDENTIFIED.has(n));
}

const S = {
  brands: "Premium Consumer Brands",
  health: "Consumer Health",
  commerce: "E-Commerce Software",
  vertical: "Vertical SaaS + Embedded Payments",
  rollups: "Tech-Enabled Roll-Ups + AI Services",
};
const co = (name: string, site: string | undefined, sector: string, description: string, exitNote?: string, aka?: string[]): PortfolioCo => ({ name, site, sector, description, exitNote, aka });

/** The 86 identified companies, from the Sidekick Portfolio Map (_Research/Firm Research). A company
 *  in one of the five industries carries its industry as its sector; the rest keep the map's sector. */
export const KNOWN: PortfolioCo[] = [
  co("Alternative Payments", "alternativepayments.io", S.vertical, "AR/AP automation and payments for MSPs and service businesses"),
  co("ArcHouse", undefined, S.vertical, "AI pre-admission and referral platform for hospice providers"),
  co("Arrive Outdoors", undefined, S.commerce, "Resells brands' returns and excess inventory (started as gear rental)"),
  co("Austen Heller", undefined, S.brands, "Men's handcrafted loafers and lace-ups"),
  co("Backdrop", "backdrophome.com", S.brands, "DTC designer paint and wallcoverings", "Acquired by F. Schumacher (2021)"),
  co("Banked", "banked.com", S.vertical, "Pay-by-bank (account-to-account) payments for merchants"),
  co("Banner Technologies", "withbanner.com", S.vertical, "Capital-spend management software for commercial real estate"),
  co("Baseline", "baselinepro.com", S.vertical, "Scheduling, payments and management software for sports facilities"),
  co("Birddogs", "birddogs.com", S.brands, "Men's shorts and chinos with built-in liners"),
  co("Bizzy Coffee", "bizzycoffee.com", S.brands, "Organic cold brew coffee and espresso"),
  co("Caper Lab", "caper.ai", S.commerce, "AI smart shopping carts for grocers", "Acquired by Instacart (2021)"),
  co("Chronograph", "chronograph.pe", S.vertical, "Portfolio monitoring for private capital investors", "Partial exit (2026 growth round)"),
  co("Cisse Trading Company", undefined, S.brands, "Fair Trade cocoa baking mixes and hot chocolate"),
  co("CoverForce", "coverforce.com", S.vertical, "AI commercial insurance distribution for carriers and agencies"),
  co("Craftwork Coffee", undefined, "Food & Beverage", "Coffee shops and coworking inside apartment buildings"),
  co("Crave Retail", "craveretail.com", S.commerce, "Smart fitting-room and floor-assist platform for retailers"),
  co("Croissant", "croissant.com", S.commerce, "Guaranteed resale value and cashback at partner fashion brands"),
  co("Crown Affair", "crownaffair.com", S.brands, "Premium haircare and hair tools"),
  co("Cusa Tea", "drinkcusa.com", S.brands, "Organic instant tea"),
  co("DailyPay", "dailypay.com", S.vertical, "On-demand pay: employees access earned wages early"),
  co("Dang", "dangfoods.com", S.brands, "Coconut chips and Asian-American inspired snacks"),
  co("dataPlor", "dataplor.com", "Data & AI", "Global place and foot-traffic data"),
  co("Dieux", "dieuxskin.com", S.brands, "Skincare: moisturizers, serums, eye masks"),
  co("Dispense", "dispenseapp.com", S.vertical, "Online ordering for cannabis dispensaries", "Acquired by Alpine IQ (2024)"),
  co("Elera Health", "withelera.com", S.rollups, "Coordinates specialist referrals, insurance checks and scheduling"),
  co("Encore Alert", undefined, "Data & AI", "Social brand-mention alerts for marketing teams", "Acquired by Meltwater (2016)"),
  co("Enroot", "drinkenroot.com", S.brands, "Non-alcoholic sparkling cold brew teas"),
  co("Erenzia", undefined, S.brands, "Latina-founded vegan hair care and fragrance"),
  co("Evereden", "ever-eden.com", S.brands, "Clean skincare for babies, kids and moms"),
  co("EverlyWell", "everlywell.com", S.health, "At-home lab tests and virtual care", "Exited per Sidekick (still operating)"),
  co("Exponent Beauty", "exponentbeauty.com", S.brands, "Self-activated clinical skincare"),
  co("Extend Fertility", "extendfertility.com", S.health, "Egg freezing and IVF clinic in New York"),
  co("FIGS", "wearfigs.com", S.brands, "Direct-to-consumer scrubs and medical apparel", "IPO (2021)"),
  co("FORME", "formelife.com", S.health, "Smart wall-mounted fitness mirror and cable trainer", "Public via Interactive Strength IPO (2023)"),
  co("Gestalt", "thegestalt.io", "Data & AI", "Enterprise AI for pricing, promotion and customer decisions"),
  co("Growcentia", "growcentia.com", "Other", "Microbial biostimulants for plant nutrient uptake"),
  co("Halo Top", "halotop.com", S.brands, "Low-calorie, high-protein ice cream", "Acquired by Wells Enterprises (2019)"),
  co("Hazel", "hellohazel.com", S.health, "Leak-protective underwear for women with incontinence"),
  co("HealthJoy", "healthjoy.com", S.health, "Employee benefits navigation with an AI assistant"),
  co("Josephine", undefined, "Food & Beverage", "Marketplace for home cooks to sell meals", "Shut down (2018)"),
  co("Lantern Platform", "lantern.is", S.commerce, "Customer accounts, loyalty and referrals for Shopify brands"),
  co("LedgerWay", "theledgerway.com", S.rollups, "Accounting and tax firm built by acquiring CPA firms", "Exited per Sidekick (buyer not found)"),
  co("LemonEdge", "lemonedge.com", S.vertical, "Fund accounting software for private equity and venture firms"),
  co("Mangomint", "mangomint.com", S.vertical, "Booking, payments and marketing software for salons and spas"),
  co("Mayweather Fitness", "mayweatherboxingandfitness.com", S.health, "Franchised boxing group-fitness studios"),
  co("Medmo", "medmo.com", S.vertical, "Medical imaging referral, scheduling and prior-authorization platform"),
  co("MedNition", "mednition.com", S.vertical, "AI that ranks high-risk emergency patients for triage"),
  co("Mented Cosmetics", "mentedcosmetics.com", S.brands, "Makeup for women of color", "Acquired by West Lane Capital (2024)"),
  co("Minded", "minded.com", S.commerce, "Builds AI agents for support workflows from plain English"),
  co("MissionU", undefined, "Education & Work", "One-year college alternative with income-share agreements", "Acquired by WeWork (2018)"),
  co("Nutpods", "nutpods.com", S.brands, "Dairy-free unsweetened coffee creamers", "Acquired by MPearlRock (2024)"),
  co("Orb", "withorb.com", S.vertical, "Usage-based billing and pricing for software and AI companies"),
  co("Our Kettle", "ourkettle.com", "Insurance", "Property insurance and wildfire reinsurance"),
  co("Ovia Health", "oviahealth.com", S.health, "Fertility, pregnancy and parenting app plus employer programs", "Acquired by Labcorp (2021)"),
  co("Paravel", "tourparavel.com", S.brands, "Design-led luggage and travel bags", "Assets bought by Antler after bankruptcy (2025)"),
  co("PerfectQuote", "perfectquote.io", S.vertical, "AI quoting platform for group health benefits brokers"),
  co("Pinata", "pinata.ai", "Fintech & Payments", "Rent rewards and credit building for renters"),
  co("Protein2o", "protein2o.com", S.brands, "Protein-infused flavored water with electrolytes"),
  co("Rae Wellness", "raewellness.co", S.health, "Premium vegan supplements for women's beauty, energy and mood"),
  co("Rainwalk", "rainwalkpetinsurance.com", S.rollups, "White-label and direct pet insurance platform"),
  co("Rebuy", "rebuyengine.com", S.commerce, "AI personalization and upsell platform for Shopify merchants"),
  co("Ring", "ring.com", "Home & Pets", "Smart video doorbells and home security", "Acquired by Amazon (2018)"),
  co("Rose Technology", "rose.ai", "Data & AI", "AI data discovery and cleaning platform for analysts"),
  co("Runa", undefined, S.brands, "Organic guayusa energy drinks and teas", "Acquired by All Market / Vita Coco (2018)"),
  co("SafeGuard Privacy", "safeguardprivacy.com", S.commerce, "Privacy and vendor compliance platform for digital advertising"),
  co("Seven Sundays", "sevensundays.com", S.brands, "High-protein, low-sugar cereals, granola and muesli"),
  co("SignalWire", "signalwire.com", "Developer / API Infrastructure", "Programmable voice, messaging and AI-agent communications APIs"),
  co("SkinTe", undefined, S.brands, "Sparkling collagen tea drinks"),
  co("Slrrrp", "slrrrp.com", S.brands, "Plant-based gelatin shots with premium alcohol"),
  co("Smartrr", "smartrr.com", S.commerce, "Subscription and loyalty app for Shopify brands", "Acquired by Relay Commerce (2025)"),
  co("Snacklins", "snacklins.com", S.brands, "Veggie chips cooked in avocado oil"),
  co("Soona", "soona.co", S.rollups, "Product photo, video and UGC production for e-commerce brands"),
  co("StartSure", undefined, S.rollups, "Business insurance MGA for startups", "Acquired by Vouch (2025)"),
  co("StorageDefender", "storage-defender.com", "Real Estate & Construction", "Smart unit monitoring for self-storage facilities"),
  co("Sundaily", undefined, S.health, "Ingestible sun-care skin gummies", "Likely shut down (2025)"),
  co("Tablelist", "tablelist.com", "Travel & Hospitality", "Nightlife table and bottle-service booking app"),
  co("The Good Patch", "thegoodpatch.com", S.health, "Plant-based wellness patches"),
  co("Till Financial", "tillfinancial.com", "Fintech & Payments", "Debit card and banking app for kids and teens"),
  co("Tire Agent", "tireagent.com", "Other", "Online tire retailer with recommendations and payment plans"),
  co("Touchland", "touchland.com", S.brands, "Hydrating hand sanitizer sprays and body mists", "Acquired by Church & Dwight (2025, up to $880M)"),
  co("UrgentIQ", "urgentiq.com", S.vertical, "AI EMR, billing and revenue-cycle software for urgent care"),
  co("Vessel Health", "vesselhealth.com", S.health, "At-home urine test cards and app for wellness biomarkers", "Acquired by Fluid Medical (2025, single source)"),
  co("Wanderu", "wanderu.com", "Travel & Hospitality", "Bus, train and flight search and booking"),
  co("Wellthy", "wellthy.com", S.rollups, "Care-coordination concierge sold as an employer benefit"),
  co("Working Not Working", "workingnotworking.com", "Education & Work", "Curated network connecting creatives with agencies and brands", "Acquired by Fiverr (2021)"),
  co("Yellowbird Foods", "yellowbirdfoods.com", S.brands, "Hot sauces", undefined, ["Yellowbird Food"]),
];

const AREA_OF_SECTOR: Record<string, string> = {
  [S.brands]: "consumer-brands",
  [S.health]: "consumer-health",
  [S.commerce]: "ecommerce-software",
  [S.vertical]: "vertical-saas",
  [S.rollups]: "roll-ups",
};

export const portfolio: FirmPortfolio = {
  site: "https://www.sidekickpartners.com/pages/portfolio-list",
  areaOf: (sector) => (sector && AREA_OF_SECTOR[sector]) || null,
  list: { names: portfolioNames, known: KNOWN },
};
