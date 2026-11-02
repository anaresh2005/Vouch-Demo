// The development timeline shown at /roadmap (Henry, November 2, 2026). Phases have no dates yet.

export interface RoadmapPhase {
  title: string;
  live: boolean;
  /** inDemo: whether the shopper demo shows it. */
  items: { title: string; description: string; inDemo: boolean }[];
}

export const ROADMAP: RoadmapPhase[] = [
  {
    title: 'Live today',
    live: true,
    items: [
      {
        title: 'Post to Pay',
        description: 'Instagram shoppers pay the discounted price today and keep the discount by posting. Vouch finds and reviews each post.',
        inDemo: true,
      },
      {
        title: 'Merchant dashboard',
        description:
          'A timeline of every Vouch order. Brands open each order’s post and charges, track return on investment from Shopify sales, set who can Vouch, and see each creator’s audience and their creators’ audience overall.',
        inDemo: false,
      },
    ],
  },
  {
    title: 'By the end of 2026',
    live: false,
    items: [
      { title: 'More platforms', description: 'TikTok, Snapchat, Substack, X and LinkedIn alongside Instagram.', inDemo: true },
      { title: 'Ambassador codes', description: 'Shoppers get their own code: their followers get a discount and they earn a share of each order.', inDemo: true },
    ],
  },
  {
    title: 'Next',
    live: false,
    items: [
      {
        title: 'Subscriptions',
        description: 'Shoppers pay a monthly, quarterly or annual plan with a post. Before each renewal charge they can choose to post instead of paying.',
        inDemo: false,
      },
      {
        title: 'Content feed for brand websites',
        description: 'A live page or section on the brand’s site that shows the latest and best-performing Vouch posts, and invites customers to join in.',
        inDemo: false,
      },
      {
        title: 'Influencer discovery',
        description:
          'A model trained on each brand’s own Vouch shoppers recommends creators beyond its natural traffic who match its best performers. Brands reach out to them from the dashboard.',
        inDemo: false,
      },
      {
        title: 'Influencer relationship management',
        description:
          'Regift top performers for sales and holidays. AI agents over text and email suggest content ideas, guide creators through posting, answer questions and hand out affiliate codes.',
        inDemo: false,
      },
    ],
  },
];
