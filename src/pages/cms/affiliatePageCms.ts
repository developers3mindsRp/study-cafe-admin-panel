/**
 * Affiliate page CMS shape (stored in cms_pages with slug='affiliates').
 * Keep defaults + merge in sync with
 * study-cafe-web/src/lib/affiliate-page-data.ts and
 * study-cafe-web/src/types/affiliate-page.types.ts.
 */

import type { CmsPageRecord } from "../../api/cmsPages";

export const AFFILIATE_SLUG = "affiliates";

export interface AffiliateCta {
  label: string;
  href: string;
}

export interface AffiliateHighlight {
  value: string;
  label: string;
}

export interface AffiliateStep {
  step: string;
  title: string;
  description: string;
}

export interface AffiliateBenefit {
  title: string;
  description: string;
  icon: string;
}

export interface AffiliateSlab {
  plan: string;
  commission: string;
  highlight?: boolean;
  badge?: string;
}

export interface AffiliatePromoCard {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface AffiliateEarner {
  name: string;
  role: string;
  image: string;
  quote: string;
}

export interface AffiliateFaqItem {
  question: string;
  answer: string;
}

export interface AffiliatePageData {
  pageTitle: string;
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: AffiliateCta;
    secondaryCta: AffiliateCta;
    highlights: AffiliateHighlight[];
  };
  intro: { title: string; subtitle: string };
  howItWorks: { sectionTitle: string; subtitle: string; steps: AffiliateStep[] };
  benefits: { sectionTitle: string; subtitle: string; items: AffiliateBenefit[] };
  commission: { sectionTitle: string; subtitle: string; note: string; slabs: AffiliateSlab[] };
  promote: { sectionTitle: string; subtitle: string; cards: AffiliatePromoCard[] };
  earners: { sectionTitle: string; subtitle: string; items: AffiliateEarner[] };
  ctaBand: {
    title: string;
    subtitle: string;
    primaryCta: AffiliateCta;
    secondaryCta: AffiliateCta;
  };
  faq: { sectionTitle: string; subtitle: string; items: AffiliateFaqItem[] };
  contact: { sectionTitle: string; companyName: string; address: string };
}

/** Icon keys rendered by the public page (study-cafe-web BENEFIT_ICONS). */
export const BENEFIT_ICON_OPTIONS = [
  { value: "courses", label: "Courses / graduation cap" },
  { value: "earnings", label: "Earnings / rupee" },
  { value: "marketing", label: "Marketing / message" },
  { value: "tracking", label: "Tracking / chart" },
  { value: "community", label: "Community / people" },
  { value: "free", label: "Free / check circle" },
  { value: "support", label: "Support / chat" },
  { value: "trophy", label: "Trophy / award" },
] as const;

export const DEFAULT_AFFILIATE_PAGE_DATA: AffiliatePageData = {
  pageTitle: "Studycafe Affiliate Program",
  hero: {
    badge: "The Leader in Online Learning",
    title: "Studycafe Affiliate Program",
    subtitle:
      "Share courses you believe in and earn up to 40% commission on every sale. Free to join, no qualification required.",
    primaryCta: { label: "Become an Affiliate", href: "https://studycafe.in/user/register.php" },
    secondaryCta: { label: "Affiliate Login", href: "https://studycafe.in/wp-login.php" },
    highlights: [
      { value: "Up to 40%", label: "Commission" },
      { value: "₹ 0", label: "Joining Fee" },
      { value: "Real Time", label: "Earning Tracking" },
      { value: "₹ 1,000", label: "Minimum Payout" },
    ],
  },
  intro: {
    title: "Unlock Earnings and Empower Education",
    subtitle:
      "Online learning has become an integral part of personal and professional growth. Studycafe is committed to making quality education accessible to as many people as possible — and the Affiliate Program lets you be part of that mission while earning commissions of up to 40%.",
  },
  howItWorks: {
    sectionTitle: "How the Program Works",
    subtitle: "Three simple steps between you and your first commission.",
    steps: [
      {
        step: "01",
        title: "Join the Program",
        description:
          "Sign up on our website in a couple of minutes. There is no fee, no prior experience and no educational qualification required.",
      },
      {
        step: "02",
        title: "Share Your Links",
        description:
          "Get ready-to-use course links, banners and text links from the My Account section and share them on social media, blogs or your website.",
      },
      {
        step: "03",
        title: "Earn Commissions",
        description:
          "Every purchase made through your link earns you up to 40% commission, tracked in real time and paid out once you cross ₹ 1,000.",
      },
    ],
  },
  benefits: {
    sectionTitle: "Why Choose the Studycafe Affiliate Program",
    subtitle: "Everything you need to build a reliable second income around education.",
    items: [
      {
        title: "High-Quality Courses",
        description:
          "A vast library of courses covering in-demand topics, so you always promote content that genuinely converts.",
        icon: "courses",
      },
      {
        title: "Lucrative Commissions",
        description:
          "Earn up to 40% on every sale — one of the highest payouts in the online education affiliate space.",
        icon: "earnings",
      },
      {
        title: "Diverse Marketing Material",
        description:
          "Customised linking tools, banners and course creatives that make promotion effortless.",
        icon: "marketing",
      },
      {
        title: "Real-Time Tracking",
        description:
          "A transparent dashboard shows clicks, conversions and earnings the moment they happen.",
        icon: "tracking",
      },
      {
        title: "Supportive Community",
        description:
          "Join a community of affiliates who share your passion for education. Connect, learn and grow together.",
        icon: "community",
      },
      {
        title: "Zero Investment",
        description:
          "Completely free to join. No upfront cost, no monthly fee — you only need a phone or a laptop.",
        icon: "free",
      },
    ],
  },
  commission: {
    sectionTitle: "Commission Slab by Membership Level",
    subtitle: "Your commission rate grows with your Studycafe membership level.",
    note: "Payouts are released once your consolidated earning reaches ₹ 1,000.",
    slabs: [
      { plan: "Free Members", commission: "20%" },
      { plan: "Basic Members", commission: "25%" },
      { plan: "Premium Members", commission: "30%" },
      { plan: "Ultimate Members", commission: "40%", highlight: true, badge: "Highest payout" },
    ],
  },
  promote: {
    sectionTitle: "What You Can Promote",
    subtitle:
      "Pick from our full catalogue of courses and memberships — every purchase through your link counts.",
    cards: [
      {
        title: "Online Courses",
        description:
          "Certification courses on GST, Income Tax, AI, Excel and more — trusted by thousands of finance professionals.",
        ctaLabel: "Explore Courses",
        href: "https://studycafe.in/courses/",
      },
      {
        title: "StudyCafe Membership",
        description:
          "Full-access memberships that unlock the entire library — our highest converting and highest paying product.",
        ctaLabel: "Explore Memberships",
        href: "https://studycafe.in/plans/",
      },
    ],
  },
  earners: {
    sectionTitle: "Meet Our Top Earners",
    subtitle: "Real affiliates, real payouts — here is what they have to say.",
    items: [
      {
        name: "Shabir Virk",
        role: "Finance Professional",
        image: "/images/userplaceholder.png",
        quote:
          "I was skeptical at first about affiliate marketing, but after signing up for Studycafe affiliate program, I was pleasantly surprised at how easy it was to get started and start earning money. My first month, I made over Rs. 40,000, and I've been making consistently over 50,000 per month ever since. I highly recommend Studycafe affiliate program to anyone looking to make a serious income online.",
      },
      {
        name: "Prabhat",
        role: "CA Final",
        image: "/images/userplaceholder.png",
        quote:
          "I am CA Final Student, but I've never made as much money as I have since joining Studycafe affiliate program. The team is incredibly supportive and helpful, and the affiliate program is very generous. I've made over Rs. 50,000 each month for the past few months, and I'm on track to make even more this month. If you're looking for an affiliate program that can help you achieve your financial goals, look no further than Studycafe affiliate program.",
      },
      {
        name: "Monika",
        role: "CA",
        image: "/images/userplaceholder.png",
        quote:
          "I was looking for a way to make money while I'm in working. I tried a few different affiliate programs, but they all required a lot of upfront investment. Then I joined Studycafe affiliate program. It's completely free to join, and I've been making over Rs. 50,000 per month without having to spend a dime. Studycafe affiliate program is the best way to make money online.",
      },
    ],
  },
  ctaBand: {
    title: "Become a StudyCafe Affiliate Partner",
    subtitle:
      "Free to join, no qualification needed. Start promoting today and turn your network into a steady income.",
    primaryCta: { label: "Register Now", href: "https://studycafe.in/user/register.php" },
    secondaryCta: { label: "Login", href: "https://studycafe.in/wp-login.php" },
  },
  faq: {
    sectionTitle: "Frequently Asked Questions",
    subtitle:
      "Got questions? We've got answers. Find everything you need to know about the Studycafe Affiliate Program.",
    items: [
      {
        question: "Is Studycafe a Legal Company?",
        answer:
          "Yes, it is legal company. You can find Studycafe Private Limited on the official website of the Ministry of Corporate Affairs, and you can check the registration details on the same.",
      },
      {
        question: "What are the Application Criteria?",
        answer:
          "There are no requirements to apply with us. It does not necessitate any prior knowledge or educational qualification. You only need your phone or Laptop to find out the information.",
      },
      {
        question: "Are there any fees to join the Studycafe affiliate program?",
        answer: "No there is no Fees to Join Studycafe affiliate program.",
      },
      {
        question: "How can I track my affiliate earnings and performance?",
        answer:
          "Our state-of-the-art tracking system ensures that you receive credit for all the traffic and conversions generated through your affiliate efforts. You can monitor your performance in real-time in My Account page under earning section and see how your efforts translate into earnings.",
      },
      {
        question: "How Much Revenue we will Earn through Studycafe Affiliate Program?",
        answer:
          "Every time someone clicks on your affiliate link and makes a purchase on Studycafe through your link, you earn a commission. The more successful referrals you make, the higher your earnings potential. Studycafe offers competitive commission rates, allowing you to earn from 20% to 40% on each sale.",
      },
      {
        question: "When and how do affiliates get paid from Studycafe Affiliate Program?",
        answer:
          "Studycafe pays out commissions on a regular basis, ensuring that you receive your earnings promptly and hassle-free. This extra income can be a valuable addition to your financial resources. Once your consolidated earning reaches Rs. 1000 we will make the payout.",
      },
    ],
  },
  contact: {
    sectionTitle: "Connect With Us",
    companyName: "Studycafe Private Limited",
    address: "1003, 10th Floor, Modi Tower 98, Nehruplace\nDelhi, 110019 - India",
  },
};

/* ── Blank rows for the "Add" buttons ─────────────────────────────── */

export const EMPTY_HIGHLIGHT: AffiliateHighlight = { value: "", label: "" };
export const EMPTY_STEP: AffiliateStep = { step: "", title: "", description: "" };
export const EMPTY_BENEFIT: AffiliateBenefit = { title: "", description: "", icon: "free" };
export const EMPTY_SLAB: AffiliateSlab = { plan: "", commission: "" };
export const EMPTY_PROMO_CARD: AffiliatePromoCard = {
  title: "",
  description: "",
  ctaLabel: "Learn More",
  href: "",
};
export const EMPTY_EARNER: AffiliateEarner = { name: "", role: "", image: "", quote: "" };
export const EMPTY_FAQ: AffiliateFaqItem = { question: "", answer: "" };

/* ── Merge ────────────────────────────────────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function optStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function mergeList<T>(
  incoming: unknown,
  defaults: T[],
  mapItem: (raw: Record<string, unknown>, template: T) => T
): T[] {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return defaults.map((d) => ({ ...d }));
  }
  const template = defaults[0];
  return incoming.filter(isRecord).map((raw, i) => mapItem(raw, defaults[i] ?? template));
}

function mergeCta(incoming: unknown, base: AffiliateCta): AffiliateCta {
  if (!isRecord(incoming)) return { ...base };
  return { label: str(incoming.label, base.label), href: str(incoming.href, base.href) };
}

const mapHighlight = (raw: Record<string, unknown>, t: AffiliateHighlight): AffiliateHighlight => ({
  value: str(raw.value, t.value),
  label: str(raw.label, t.label),
});

const mapStep = (raw: Record<string, unknown>, t: AffiliateStep): AffiliateStep => ({
  step: str(raw.step, t.step),
  title: str(raw.title, t.title),
  description: str(raw.description, t.description),
});

const mapBenefit = (raw: Record<string, unknown>, t: AffiliateBenefit): AffiliateBenefit => ({
  title: str(raw.title, t.title),
  description: str(raw.description, t.description),
  icon: str(raw.icon, t.icon),
});

const mapSlab = (raw: Record<string, unknown>, t: AffiliateSlab): AffiliateSlab => ({
  plan: str(raw.plan, t.plan),
  commission: str(raw.commission, t.commission),
  highlight: typeof raw.highlight === "boolean" ? raw.highlight : false,
  badge: typeof raw.badge === "string" ? raw.badge : "",
});

const mapPromoCard = (raw: Record<string, unknown>, t: AffiliatePromoCard): AffiliatePromoCard => ({
  title: str(raw.title, t.title),
  description: str(raw.description, t.description),
  ctaLabel: str(raw.ctaLabel, t.ctaLabel),
  href: str(raw.href, t.href),
});

const mapEarner = (raw: Record<string, unknown>, t: AffiliateEarner): AffiliateEarner => ({
  name: str(raw.name, t.name),
  role: str(raw.role, t.role),
  image: str(raw.image, t.image),
  quote: str(raw.quote, t.quote),
});

const mapFaq = (raw: Record<string, unknown>, t: AffiliateFaqItem): AffiliateFaqItem => ({
  question: str(raw.question, t.question),
  answer: str(raw.answer, t.answer),
});

export function mergeAffiliatePageFromCmsRecord(page: CmsPageRecord | null): AffiliatePageData {
  const out: AffiliatePageData = JSON.parse(
    JSON.stringify(DEFAULT_AFFILIATE_PAGE_DATA)
  ) as AffiliatePageData;

  if (!page) return out;

  if (page.title && String(page.title).trim()) out.pageTitle = String(page.title);

  const m = isRecord(page.meta) ? page.meta : {};

  if (isRecord(m.hero)) {
    const h = m.hero;
    out.hero.badge = optStr(h.badge, out.hero.badge);
    out.hero.title = str(h.title, out.hero.title);
    out.hero.subtitle = optStr(h.subtitle, out.hero.subtitle);
    out.hero.primaryCta = mergeCta(h.primaryCta, out.hero.primaryCta);
    out.hero.secondaryCta = mergeCta(h.secondaryCta, out.hero.secondaryCta);
    out.hero.highlights = mergeList(h.highlights, out.hero.highlights, mapHighlight);
  }

  if (isRecord(m.intro)) {
    out.intro.title = str(m.intro.title, out.intro.title);
    out.intro.subtitle = optStr(m.intro.subtitle, out.intro.subtitle);
  }

  if (isRecord(m.howItWorks)) {
    const h = m.howItWorks;
    out.howItWorks.sectionTitle = str(h.sectionTitle, out.howItWorks.sectionTitle);
    out.howItWorks.subtitle = optStr(h.subtitle, out.howItWorks.subtitle);
    out.howItWorks.steps = mergeList(h.steps, out.howItWorks.steps, mapStep);
  }

  if (isRecord(m.benefits)) {
    const b = m.benefits;
    out.benefits.sectionTitle = str(b.sectionTitle, out.benefits.sectionTitle);
    out.benefits.subtitle = optStr(b.subtitle, out.benefits.subtitle);
    out.benefits.items = mergeList(b.items, out.benefits.items, mapBenefit);
  }

  if (isRecord(m.commission)) {
    const c = m.commission;
    out.commission.sectionTitle = str(c.sectionTitle, out.commission.sectionTitle);
    out.commission.subtitle = optStr(c.subtitle, out.commission.subtitle);
    out.commission.note = optStr(c.note, out.commission.note);
    out.commission.slabs = mergeList(c.slabs, out.commission.slabs, mapSlab);
  }

  if (isRecord(m.promote)) {
    const p = m.promote;
    out.promote.sectionTitle = str(p.sectionTitle, out.promote.sectionTitle);
    out.promote.subtitle = optStr(p.subtitle, out.promote.subtitle);
    out.promote.cards = mergeList(p.cards, out.promote.cards, mapPromoCard);
  }

  if (isRecord(m.earners)) {
    const e = m.earners;
    out.earners.sectionTitle = str(e.sectionTitle, out.earners.sectionTitle);
    out.earners.subtitle = optStr(e.subtitle, out.earners.subtitle);
    out.earners.items = mergeList(e.items, out.earners.items, mapEarner);
  }

  if (isRecord(m.ctaBand)) {
    const c = m.ctaBand;
    out.ctaBand.title = str(c.title, out.ctaBand.title);
    out.ctaBand.subtitle = optStr(c.subtitle, out.ctaBand.subtitle);
    out.ctaBand.primaryCta = mergeCta(c.primaryCta, out.ctaBand.primaryCta);
    out.ctaBand.secondaryCta = mergeCta(c.secondaryCta, out.ctaBand.secondaryCta);
  }

  if (isRecord(m.faq)) {
    const f = m.faq;
    out.faq.sectionTitle = str(f.sectionTitle, out.faq.sectionTitle);
    out.faq.subtitle = optStr(f.subtitle, out.faq.subtitle);
    out.faq.items = mergeList(f.items, out.faq.items, mapFaq);
  }

  if (isRecord(m.contact)) {
    const c = m.contact;
    out.contact.sectionTitle = str(c.sectionTitle, out.contact.sectionTitle);
    out.contact.companyName = str(c.companyName, out.contact.companyName);
    out.contact.address = optStr(c.address, out.contact.address);
  }

  return out;
}

/** Drops empty rows so a half-filled "Add" row never reaches the public page. */
export function affiliatePageDataToMetaPayload(data: AffiliatePageData): Record<string, unknown> {
  return {
    hero: {
      ...data.hero,
      highlights: data.hero.highlights.filter((h) => h.value.trim() || h.label.trim()),
    },
    intro: data.intro,
    howItWorks: {
      ...data.howItWorks,
      steps: data.howItWorks.steps.filter((s) => s.title.trim() || s.description.trim()),
    },
    benefits: {
      ...data.benefits,
      items: data.benefits.items.filter((b) => b.title.trim() || b.description.trim()),
    },
    commission: {
      ...data.commission,
      slabs: data.commission.slabs
        .filter((s) => s.plan.trim() || s.commission.trim())
        .map((s) => ({
          plan: s.plan,
          commission: s.commission,
          highlight: Boolean(s.highlight),
          badge: s.badge?.trim() ? s.badge : "",
        })),
    },
    promote: {
      ...data.promote,
      cards: data.promote.cards.filter((c) => c.title.trim() || c.description.trim()),
    },
    earners: {
      ...data.earners,
      items: data.earners.items.filter((e) => e.name.trim() || e.quote.trim()),
    },
    ctaBand: data.ctaBand,
    faq: {
      ...data.faq,
      items: data.faq.items.filter((f) => f.question.trim() || f.answer.trim()),
    },
    contact: data.contact,
  };
}
