// The startups saved for Sidekick: the leads in Sidekick Thesis (Enhanced) section 8, found by Scout for Courtside and
// touching Sidekick's industries. Leads to vet, not picks; the Library backfill looks each one up.
// The team's own adds carry `details`, Claude-checked against each source: they get a card straight away (the daily
// Startup Signals job, src/lib/jobs/team-picks.ts), and their facts show under Key Facts on the company page.
import type { LibraryPick } from "../Engine/src/firm/types";

const thesis = (name: string, domain?: string): LibraryPick => ({ name, domain, from: "thesis" });

const PORTFOLIO = "https://www.sidekickpartners.com/pages/portfolio-list";

// user, 11-11-26: "add the below companies to the sidekick scout … find revenue estimates". Checked 11-11-26.
const tipTop: LibraryPick = {
  name: "Tip Top Proper Cocktails",
  domain: "tiptopcocktails.com",
  from: "team",
  details: {
    checked: "11-11-26",
    area: "consumer-brands",
    description:
      "Classic cocktails, ready to pour, for bars, venues, airlines and home. The recipes come from James Beard finalist Miles Macquarrie of Kimball House.",
    descriptionUrl: "https://tiptopcocktails.com/pages/about-us",
    signal: {
      title: "Tip Top Proper Cocktails Introduces Passion Fruit Martini Just in Time for Holiday Entertaining",
      url: "https://www.bevnet.com/pr/2026/11/05/tip-top-proper-cocktails-introduces-passion-fruit-martini-just-in-time-for-holiday-entertaining",
      source: "BevNET",
      date: "2026-11-05",
    },
    // user, 11-11-26: "similar to their investment in Slrrrp"
    like: "Slrrrp",
    // the site's header logo is cream on clear (invisible on a cream card); its own icon, 64 px, beats Google's 32 px copy
    logo: "https://tiptopcocktails.com/cdn/shop/files/favicon.png?v=1647956883",
    facts: [
      { label: "Revenue, 2025 (Company)", value: "Over $10M; the CEO expects almost double in 2026", source: "Beer Business Daily", url: "https://beernet.com/wsd/wsd-article/tip-tops-ascent-to-the-tip-top-of-the-high-abv-cocktail-game/", date: "2026-05-21" },
      { label: "Revenue, Last 12 Months (Company)", value: "Over $10M", source: "Business of Drinks", url: "https://podscan.fm/podcasts/business-of-drinks/episodes/79-how-tip-top-became-the-1-high-proof-rtd-with-ceo-nick-reely-business-of-drinks", date: "2025-08-27" },
      { label: "Revenue (Company)", value: "A $10M business, per co-founder Yoni Reisman", source: "The Spirits Business", url: "https://www.thespiritsbusiness.com/2025/06/tip-top-cocktails-promotes-nick-reely-to-ceo/", date: "2025-06-27" },
      // over $10M by 08-25, plus four more months at 72% growth, is about $12M
      { label: "Revenue, 2025 (Estimate)", value: "About $10M–$12M: over $10M by 08-25, growing 72%", source: "Business of Drinks", url: "https://podscan.fm/podcasts/business-of-drinks/episodes/79-how-tip-top-became-the-1-high-proof-rtd-with-ceo-nick-reely-business-of-drinks" },
      // "almost double" read as 1.8x to 1.95x
      { label: "Revenue, 2026 (Estimate)", value: "About $18M–$23M, if the CEO's \"almost double\" holds", source: "Beer Business Daily", url: "https://beernet.com/wsd/wsd-article/tip-tops-ascent-to-the-tip-top-of-the-high-abv-cocktail-game/" },
      { label: "Sales Growth (Company)", value: "Up 72% year over year", source: "Business of Drinks", url: "https://podscan.fm/podcasts/business-of-drinks/episodes/79-how-tip-top-became-the-1-high-proof-rtd-with-ceo-nick-reely-business-of-drinks", date: "2025-08-27" },
      { label: "Nielsen Rank", value: "No. 38 by ready-to-drink volume, up from about No. 60 that year", source: "Modern Retail", url: "https://www.modernretail.co/operations/how-rtd-cocktail-brand-tip-top-shifted-its-strategy-to-find-the-right-type-of-variety-pack-to-sell-in-retail/", date: "2024-10-31" },
      { label: "Distribution", value: "Over 25 states; Trader Joe's, Whole Foods, Gelson's", source: "Modern Retail", url: "https://www.modernretail.co/operations/how-rtd-cocktail-brand-tip-top-shifted-its-strategy-to-find-the-right-type-of-variety-pack-to-sell-in-retail/", date: "2024-10-31" },
      { label: "Funding", value: "One angel round (03-01-20), amount not disclosed", source: "CB Insights", url: "https://www.cbinsights.com/company/tip-top-cocktails/financials" },
      { label: "Founded", value: "2018, by Yoni Reisman and Neal Cohen", source: "The Spirits Business", url: "https://www.thespiritsbusiness.com/2025/06/tip-top-cocktails-promotes-nick-reely-to-ceo/", date: "2025-06-27" },
      { label: "Leadership", value: "Nick Reely, CEO since 06-25; Reisman stays as chairman", source: "The Spirits Business", url: "https://www.thespiritsbusiness.com/2025/06/tip-top-cocktails-promotes-nick-reely-to-ceo/", date: "2025-06-27" },
      { label: "Headquarters", value: "Atlanta, Georgia", source: "BevNET", url: "https://www.bevnet.com/pr/2026/07/24/atlantas-tip-top-proper-cocktails-wins-rtd-of-the-year-at-nola-spirits-competition", date: "2026-07-24" },
      { label: "Similar Sidekick Deal", value: "Slrrrp: gelatin shots made with premium alcohol", source: "Sidekick's Portfolio", url: PORTFOLIO },
      { label: "Buyer in the Category", value: "Sazerac (Fireball) bought BuzzBallz, canned cocktails; price not disclosed", source: "Food Dive", url: "https://www.fooddive.com/news/fireball-maker-sazerac-acquires-rtd-cocktail-maker-buzzballz-spirits-alcohol-market/711116/", date: "2024-03-25" },
    ],
  },
};

const kaizntree: LibraryPick = {
  name: "Kaizntree",
  domain: "kaizntree.com",
  from: "team",
  details: {
    checked: "11-11-26",
    area: "ecommerce-software",
    description:
      "Operations software for growing food and drink brands. It runs purchasing, inventory, production, lot tracking and orders in one place, with a free Shopify app, and JP, its AI assistant, processes purchase orders and builds sales and stock reports.",
    descriptionUrl: "https://www.kaizntree.com/",
    signal: {
      title: "How Kaizntree Is Becoming the Operations Management Platform for Business Owners Around the World",
      url: "https://hackernoon.com/how-kaizntree-is-becoming-the-operations-management-platform-for-business-owners-around-the-world",
      source: "HackerNoon",
      date: "2024-08-26",
    },
    facts: [
      { label: "Revenue (Database)", value: "Under $5M; the company publishes none", source: "ZoomInfo", url: "https://www.zoominfo.com/c/kaizntree/557783109" },
      { label: "Funding", value: "About $110K, from accelerators only: 500 Global, NYU", source: "PitchBook", url: "https://pitchbook.com/profiles/company/565427-35" },
      { label: "Team Size", value: "11 people", source: "Tracxn", url: "https://tracxn.com/d/companies/kaizntree/__uqAcOLw4hj0Rq_9lp51JuavlxsuUVrusCB-Sz9rivgU", date: "2026-08-31" },
      { label: "Founders", value: "Marcos Brisson and Benoît Van Keer, NYU Shanghai graduates", source: "NYU Entrepreneurial Institute", url: "https://entrepreneur.nyu.edu/blog/2024/05/14/marcos-brisson-kaizntree/", date: "2024-05-14" },
      { label: "Customers Named", value: "Actual Veggies, Kahawa 1893, BAR-U-EAT, oomé, Barakah Eats", source: "Kaizntree", url: "https://www.kaizntree.com/" },
      { label: "Shopify App", value: "Free; 5.0 stars from 5 reviews", source: "Shopify App Store", url: "https://apps.shopify.com/kaizntree" },
      { label: "AI Assistant Pricing", value: "By use, with no cap on workflow runs", source: "Kaizntree", url: "https://www.kaizntree.com/" },
      { label: "Office", value: "New York, NY; other profiles say Palo Alto", source: "Shopify App Store", url: "https://apps.shopify.com/kaizntree" },
      { label: "Possible First Customers", value: "9 Sidekick food and drink brands, such as Seven Sundays and Protein2o", source: "Sidekick's Portfolio", url: PORTFOLIO },
      { label: "Buyer in the Category", value: "Descartes bought Finale Inventory: about $40M, plus up to $15M earn-out", source: "FreightWaves", url: "https://www.freightwaves.com/news/descartes-buys-e-commerce-inventory-management-platform-for-40m", date: "2025-08-04" },
    ],
  },
};

export const library: LibraryPick[] = [thesis("Snag"), thesis("SuperMush"), thesis("Bird&Be"), thesis("CatchBack"), tipTop, kaizntree];
