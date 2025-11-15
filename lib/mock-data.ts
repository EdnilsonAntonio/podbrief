// Mock data for PodBrief

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

export const MOCK_TRANSCRIPTIONS = [
  {
    id: "1",
    fileName: "The Future of AI Podcast - Episode 42",
    duration: 45,
    creditsUsed: 45,
    status: "completed" as const,
    createdAt: new Date("2024-01-15T10:30:00"),
    audioUrl: "/audio/sample1.mp3",
    transcription: `Welcome to The Future of AI Podcast. Today we're discussing the latest developments in artificial intelligence and machine learning. Our guest today is Dr. Sarah Johnson, a leading researcher in the field of neural networks.

[00:01:30] Dr. Johnson, thank you for joining us today. Can you tell us about your recent work on transformer architectures?

[00:01:45] Thank you for having me. Our recent research has focused on improving the efficiency of transformer models while maintaining their performance. We've developed a new architecture that reduces computational requirements by up to 40%.

[00:02:15] That's fascinating. Can you explain how this impacts real-world applications?

[00:02:30] Absolutely. This means that smaller organizations and researchers with limited computational resources can now train and deploy state-of-the-art models. It democratizes access to advanced AI capabilities.`,
    summary: {
      bulletPoints: [
        "Dr. Sarah Johnson discusses new transformer architecture",
        "40% reduction in computational requirements",
        "Democratizes AI access for smaller organizations",
        "Maintains performance while improving efficiency",
      ],
      keywords: [
        "AI",
        "transformer",
        "neural networks",
        "machine learning",
        "efficiency",
      ],
      sentiment: "positive",
      shortSummary:
        "Discussion about a new efficient transformer architecture that reduces computational needs by 40%.",
      longSummary:
        "In this episode, Dr. Sarah Johnson discusses her team's breakthrough in transformer architecture design. The new model reduces computational requirements by 40% while maintaining performance, making advanced AI more accessible to smaller organizations and researchers with limited resources.",
      language: "en",
    },
  },
  {
    id: "2",
    fileName: "Tech Talk Weekly - Startup Funding",
    duration: 28,
    creditsUsed: 28,
    status: "completed" as const,
    createdAt: new Date("2024-01-14T14:20:00"),
    audioUrl: "/audio/sample2.mp3",
    transcription: `This week on Tech Talk Weekly, we're diving into the world of startup funding. The landscape has changed dramatically over the past year.

[00:00:30] Venture capital firms are becoming more selective, focusing on profitability and sustainable growth rather than just user acquisition.

[00:01:00] We're seeing a shift towards bootstrapped companies and alternative funding methods like revenue-based financing.`,
    summary: {
      bulletPoints: [
        "Startup funding landscape has changed",
        "VCs focusing on profitability over growth",
        "Rise of bootstrapped companies",
        "Alternative funding methods gaining traction",
      ],
      keywords: [
        "startup",
        "funding",
        "venture capital",
        "bootstrapping",
        "financing",
      ],
      sentiment: "neutral",
      shortSummary:
        "Analysis of changing startup funding trends with focus on profitability.",
      longSummary:
        "The podcast explores how startup funding has evolved, with venture capital firms becoming more selective and prioritizing profitability. The discussion covers the rise of bootstrapped companies and alternative funding methods.",
      language: "en",
    },
  },
  {
    id: "3",
    fileName: "Marketing Insights - Q4 2024",
    duration: 62,
    creditsUsed: 62,
    status: "processing" as const,
    createdAt: new Date("2024-01-16T09:15:00"),
    audioUrl: "/audio/sample3.mp3",
    transcription: "",
    summary: null,
  },
  {
    id: "4",
    fileName: "Design Systems Deep Dive",
    duration: 35,
    creditsUsed: 35,
    status: "completed" as const,
    createdAt: new Date("2024-01-13T16:45:00"),
    audioUrl: "/audio/sample4.mp3",
    transcription: `Today we're exploring design systems and how they've become essential for modern product development.

[00:00:45] A well-designed system ensures consistency across all touchpoints while allowing for flexibility and innovation.`,
    summary: {
      bulletPoints: [
        "Design systems essential for modern products",
        "Balance between consistency and flexibility",
        "Improves team collaboration",
      ],
      keywords: ["design", "systems", "UI", "UX", "consistency"],
      sentiment: "positive",
      shortSummary:
        "Discussion on the importance of design systems in product development.",
      longSummary:
        "The episode covers how design systems have become crucial for modern product development, ensuring consistency while maintaining flexibility for innovation.",
      language: "en",
    },
  },
  {
    id: "5",
    fileName: "Failed Upload - Corrupted File",
    duration: 0,
    creditsUsed: 0,
    status: "error" as const,
    createdAt: new Date("2024-01-12T11:00:00"),
    audioUrl: "",
    transcription: "",
    summary: null,
  },
];

export type Transcription = (typeof MOCK_TRANSCRIPTIONS)[number];

export const MOCK_USER = {
  id: "user_123",
  email: "user@example.com",
  name: "John Doe",
  imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  credits: 150,
  currentPlan: "creator" as const,
  createdAt: new Date("2024-01-01T00:00:00"),
};

export const MOCK_INVOICES = [
  {
    id: "inv_1",
    date: new Date("2024-01-01T00:00:00"),
    plan: "Creator",
    amount: 4.99,
    status: "paid" as const,
    credits: 50,
  },
  {
    id: "inv_2",
    date: new Date("2023-12-01T00:00:00"),
    plan: "Creator",
    amount: 4.99,
    status: "paid" as const,
    credits: 50,
  },
  {
    id: "inv_3",
    date: new Date("2023-11-01T00:00:00"),
    plan: "Starter",
    amount: 1.99,
    status: "paid" as const,
    credits: 20,
  },
];
