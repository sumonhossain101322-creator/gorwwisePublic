export type Post = {
  slug: string;
  title: string;
  category: string;
  img: string;
  imgAlt?: string;
  datePublished: string;
  dateModified: string;
  description: string;
  keywords: string[];
  user: { name: string; image?: string };
  author: {
    name: string; role: string; image: string; bio: string;
    articlesHref?: string;
    socials?: { facebook?: string; twitter?: string; linkedin?: string };
  };
  desc: string;
};

export const DUMMY_POST: Post = {
  slug: "building-wealth-in-your-30s",
  title: "The Ultimate Guide to Building Wealth in Your 30s",
  category: "Personal Finance",
  img: "/p1.jpg",
  imgAlt: "A financial plan and investment notes on a desk",
  datePublished: "2024-06-10T09:00:00.000Z",
  dateModified: "2024-06-10T09:00:00.000Z",
  description: "A practical guide to building long-term wealth with compound interest, diversified index funds, and a plan you can stick to.",
  keywords: ["personal finance", "compound interest", "index funds", "wealth building"],
  user: { name: "Sarah Jenkins, CFP", image: "/p2.jpg" },
  author: {
    name: "Sarah Jenkins, CFP",
    role: "Certified Financial Planner",
    image: "/p3.jpg",
    bio: "Sarah is a Certified Financial Planner with 10 years of experience in wealth management. She helps readers make confident, practical decisions about saving and investing.",
    articlesHref: "/author/sarah-jenkins",
    socials: {},
  },
  desc: `
    <p>Building wealth in your 30s starts with a repeatable plan: spend less than you earn, protect your emergency savings, and invest consistently for goals that are years away. Small contributions can become meaningful over time because compound interest lets investment growth generate further growth. The key is to begin with an amount you can sustain and increase it as your income changes.</p>
    <p>For many long-term investors, low-cost, broadly diversified index funds can provide exposure to hundreds or thousands of companies without requiring constant stock picking. Choose an allocation that reflects your timeline and tolerance for market swings, understand the fees and tax rules that apply in your country, and keep short-term cash needs out of volatile investments. Regular contributions and periodic reviews can help you stay focused through market cycles.</p>
    <h2>Make consistency your advantage</h2>
    <p>Automating contributions after payday can turn investing into a habit rather than a monthly decision. Review your savings rate, debt costs, and investment mix at least once a year, and adjust when your circumstances change. No strategy guarantees a return, but a diversified approach and a long time horizon can help keep decisions grounded in your goals.</p>
  `,
};
