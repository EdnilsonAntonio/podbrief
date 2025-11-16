// Pricing plans configuration for PodBrief
// This is not mock data - these are the actual pricing plans available

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 20,
    minutes: 20,
    price: 1.99,
    popular: false,
  },
  {
    id: "creator",
    name: "Creator",
    credits: 50,
    minutes: 50,
    price: 4.99,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 120,
    minutes: 120,
    price: 9.99,
    popular: false,
  },
  {
    id: "studio",
    name: "Studio",
    credits: 300,
    minutes: 300,
    price: 19.99,
    popular: false,
  },
  {
    id: "agency",
    name: "Agency",
    credits: 600,
    minutes: 600,
    price: 34.99,
    popular: false,
  },
] as const;

export type PricingPlan = (typeof PRICING_PLANS)[number];

// Note: All mock data has been removed and replaced with real data from the database
// - User data: fetched from /api/user/profile
// - Invoices: fetched from /api/user/invoices
// - Transcriptions: fetched from /api/transcriptions
