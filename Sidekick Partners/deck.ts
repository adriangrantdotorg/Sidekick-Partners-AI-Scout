// Sidekick's Deck Screen (VC Scout Plan section 5): the screen from Sidekick Thesis (Enhanced) section 5, in the order
// it is read, each with what it asks in plain words (user, 10-31-26: "communicate what is actually happening here
// and why it is of value"); the red flags per industry from the checked research; the one sample deck kept for the demo.
import type { FirmDeck } from "../Engine/src/firm/types";

export const deck: FirmDeck = {
  screen: [
    { key: "stageRaise", label: "Stage and Raise", asks: "Is this a round Sidekick invests in, at a check size it writes?" },
    { key: "numbers", label: "The Numbers", asks: "Revenue, margins and growth, as the deck states them" },
    { key: "pathToProfit", label: "Path to Profit", asks: "Can it reach break-even on the money it's raising?" },
    { key: "founderFit", label: "Founder–Startup Fit", asks: "Why this team is the one to win this market" },
    { key: "exitPath", label: "Exit Path", asks: "Who would buy it, and what buyers like them have paid" },
    { key: "missing", label: "What's Missing", asks: "The numbers a partner will ask for that the deck leaves out" },
  ],
  // Questions for the deck, never scored (Plan section 5, "Red flags per industry", from the five industry files)
  redFlags: {
    "consumer-brands": ["Gross margin quoted before trade spend and distributor deductions", "Retail shelf sales quoted instead of invoiced sales"],
    "consumer-health": ["No proof of employer medical-claims savings", "Reliance on compounded GLP-1s or unapproved peptides"],
    "ecommerce-software": ["How much revenue comes from Shopify Plus brands", "Return on ad spend claimed with no test against a control group", "Shopify's 15% fee left out of cost of revenue"],
    "vertical-saas": ["Card payments booked as revenue before card fees", "Payments sold as an optional add-on"],
    "roll-ups": ["EBITDA add-backs with no quality-of-earnings check", "A software multiple asked while gross margin hasn't moved"],
  },
  // Cartwise is made up (Plan section 5): every number on it reads Sample.
  sample: {
    sample: true,
    company: "Cartwise",
    oneLine: "AI upsell offers for Shopify brands",
    area: "ecommerce-software",
    stage: "Seed",
    raising: "$2.5M",
    file: "Cartwise_Seed_Deck.pdf · 18 pages",
    // the Status Table's rows (round 9's R9-deck.html, user's pick: round 7's D)
    screen: [
      { key: "stageRaise", status: "shown", figure: "$2.5M", text: "Seed; inside Sidekick's $1M to $10M check range." },
      { key: "numbers", status: "partial", figure: "$1.2M ARR", text: "Up 3.1x in 12 months at a 71% gross margin; retention and payback aren't given." },
      { key: "pathToProfit", status: "claimed", figure: "$3M ARR", text: "Claims break-even at $3M ARR, with no cost plan behind it." },
      { key: "founderFit", status: "shown", figure: "2 Founders", text: "Both from Shopify partner agencies." },
      { key: "exitPath", status: "shown", figure: "~$350M", text: "Commerce platforms buy tools like this: Instacart bought Caper (10-19-21)." },
      { key: "missing", status: "absent", figure: "3 Gaps", text: "Churn, payback, and how the 18% lift was measured." },
    ],
    moat: { strength: "thin", text: "A funded rival could copy the offer engine within a year; the data from 140 stores is the start of one." },
    vaguestClaim: { quote: "\"Lifts average order value 18%.\"", status: "claimed", why: "Not proven: the deck shows no test against a group of shoppers who never saw the offers." },
    hardestQuestion: "How many of your 140 merchants are Shopify Plus brands, and what's monthly churn for the rest?",
    bottomLine: "A fast-growing upsell app whose headline number is unproven. Take the meeting only if they share a test against a control group.",
    unitEconomics: [
      { key: "price", value: "$450 a month, average", number: 450 },
      { key: "arrGrowth", value: "3.1x in 12 months", number: 210 },
      { key: "grossMargin", value: "71%", number: 71 },
      { key: "cacPayback", value: null, number: null },
      { key: "nrr", value: null, number: null },
      { key: "burnMultiple", value: null, number: null },
    ],
    redFlags: [
      { flag: "How much revenue comes from Shopify Plus brands", seen: "missing" },
      { flag: "Return on ad spend claimed with no test against a control group", seen: "found" },
      { flag: "Shopify's 15% fee left out of cost of revenue", seen: "clear" },
    ],
  },
};
